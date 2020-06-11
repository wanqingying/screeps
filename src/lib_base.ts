import { clearTickOut, setTickOut } from './lib_tick_out';

export function findNearTarget<T>(base, targets: any[]): T {
    const c = base.pos || base;
    const tt = targets.sort((a, b) => {
        return w_utils.count_distance(c, a.pos || a) - w_utils.count_distance(c, b.pos || b);
    });
    return tt.shift();
}

// 锁定当前单位的目标
export function getActionLockTarget<T>(
    creep: Creep,
    lock_key: string,
    getTarget,
    // 锁定的 tick 限制
    // 有的目标限制 tick 会导致浪费
    tickLimit?
): { target: T | any; unLock: () => void } {
    let target;
    let key = `lock_${lock_key}`;
    let cache_key = key + creep.name;
    let cache_id = w_cache.get(cache_key);

    function reset() {
        w_cache.delete(cache_key);
        w_cache.delete(cache_key + 'tickOut');
    }

    if (cache_id) {
        target = Game.getObjectById(cache_id);
    } else {
        target = getTarget();
        if (tickLimit && target) {
            let fn_id = setTickOut(tickLimit, reset);
            w_cache.set(cache_key + 'tickOut', fn_id);
        }
        w_cache.set(cache_key, cache_id);
    }

    return { target, unLock: reset };
}

// 先进后出队列
export class ListA<T> {
    private readonly array: T[];
    private usage: number = 0;
    public readonly max: number;
    constructor(length: number) {
        this.array = new Array(length).fill(undefined);
        this.max = length;
    }
    public push(unit: T) {
        const res = this.array.push(unit);
        this.array.shift();
        this.usage++;
        return res;
    }
    public filter = f => this.array.filter(f);
    public every = f => this.array.every(f);
    public get length() {
        return Math.min(this.max, this.usage);
    }
    public _get_array = () => this.array;
}

// 获取等级
export function getEnergyLevel(energyMax: number) {
    // 每等级扩展提供的数量 0-300=>1 300-550=>2
    const energy_ext = [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000];
    let min = 0;
    let max = 0;
    for (let i = 1; i < energy_ext.length; i++) {
        min = 300 + energy_ext[i];
        max = 300 + energy_ext[i + 1];
        if (min < energyMax && energyMax <= max) {
            return i;
        }
    }
}

export function getCreepBody(creep: Creep): { [type in BodyPartConstant]: number } {
    let body = {};
    creep.body.forEach(b => {
        let type = b.type;
        if (body[type]) {
            body[type]++;
        } else {
            body[type] = 1;
        }
    });
    return body as any;
}
export function getCreepBodyNum(creep: Creep, type: BodyPartConstant): number {
    let body = getCreepBody(creep);
    return body[type] || 0;
}

export function getCreepsRoleAbility(creeps: Creep[], role: role_name_key) {
    let carry = 0;
    let mine = 0;
    creeps.forEach(creep => {
        if (creep.memory?.role === w_role_name.carrier) {
            carry += getCreepBodyNum(creep, CARRY);
        }
        if (creep.memory?.role === w_role_name.harvester) {
            mine += getCreepBodyNum(creep, WORK);
        }
        if (creep.memory?.role === w_role_name.starter) {
            carry += getCreepBodyNum(creep, CARRY) / 2;
            mine += getCreepBodyNum(creep, WORK) / 2;
        }
    });
    switch (role) {
        case w_role_name.harvester:
            return mine;
        case w_role_name.carrier:
            return carry;
        default:
            return 0;
    }
}

export function getBodyCost(body: BodyPartConstant[]): number {
    let cost = 0;
    body.forEach(b => {
        cost += w_config.internal.body_cost[b];
    });
    return cost;
}

export function isEmpty(target: any, type?: ResourceConstant): boolean {
    return target?.store?.getUsedCapacity(type || RESOURCE_ENERGY) === 0;
}
export function isNotEmpty(target: any, type?: ResourceConstant): boolean {
    return target?.store?.getUsedCapacity(type || RESOURCE_ENERGY) > 0;
}
export function isNotFull(target: any, type?: ResourceConstant): boolean {
    return target?.store?.getFreeCapacity(type || RESOURCE_ENERGY) > 0;
}
export function isFull(target: any, type?: ResourceConstant): boolean {
    return target?.store?.getFreeCapacity(type || RESOURCE_ENERGY) === 0;
}

// 按照优先级顺序找到建筑
export function findByOrder<K extends FindConstant>(
    room: Room,
    filter?: FilterFunction<K>,
    structureTypesOrder?: StructureConstant[]
): Array<FindTypes[K]> {
    let structureFilters = structureTypesOrder || [
        STRUCTURE_SPAWN,
        STRUCTURE_EXTENSION,
        STRUCTURE_TOWER,
        STRUCTURE_CONTAINER,
        STRUCTURE_STORAGE,
    ];
    const targets = room.find(FIND_STRUCTURES);
    for (let i = 0; i < structureFilters.length; i++) {
        let ck = targets.filter(t => {
            let meet_type = t.structureType === structureFilters[i];
            let meet_filter = true;
            if (filter) {
                meet_filter = filter(t as any);
            }
            return meet_type && meet_filter;
        });
        if (ck.length > 0) {
            return ck as any[];
        }
    }

    return [];
}

// 能量矿边上的container不能drop
export function isTargetNearSource(room: Room, target: StructureContainer) {
    if (target.structureType !== STRUCTURE_CONTAINER) {
        return false;
    }
    if (!room?.sourceInfo?.length) {
        return false;
    }
    console.log(room.sourceInfo.length);
    return room.sourceInfo?.find(s => s.container?.id === target?.id);
}

export function findRepairTarget(room: Room, types?: any[] | null, excludes?: any[]): AnyStructure {
    let targets = room
        .findBy(FIND_STRUCTURES, t => {
            if (types && !types.includes(t.structureType)) {
                return false;
            }
            if (excludes && excludes.includes(t.structureType)) {
                return false;
            }
            return t.hits < (t.hitsMax * 4) / 5;
        })
        .sort((a, b) => {
            return a.hits - b.hits;
        });
    return targets.shift();
}

export function findTargetAttack(room: Room) {
    let target = room.find(FIND_HOSTILE_CREEPS);
    return target.pop();
}
