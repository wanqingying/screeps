// 不能引用其他模块

export function find_nearby_target<T>(base, targets: any[]): T {
    const c = base.pos || base;
    const tt = targets.sort((a, b) => {
        return w_utils.count_distance(c, a.pos || a) - w_utils.count_distance(c, b.pos || b);
    });
    return tt.shift();
}

let seed = 0;
export function getActionLockTarget<T>(
    creep: Creep,
    lock_key: string,
    getTarget
): { target: T | any; unLock: () => void } {
    seed += 1;
    let target;
    let key = `lock_${lock_key}`;
    let cache_key = creep.memory[key];
    if (cache_key) {
        target = Game.getObjectById(cache_key);
    } else {
        target = getTarget();
        creep.memory[key] = target?.id;
    }

    function reset() {
        creep.memory[key] = undefined;
        creep.log_one(' reset ', key);
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
        min = 300 + energy_ext[i - 1];
        max = 300 + energy_ext[i];
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
// carry ability
export function getCreepsCarry(creeps: Creep[]) {
    let carry = 0;
    creeps.forEach(creep => {
        if (creep.memory.role === 'carrier') {
            let bd = getCreepBody(creep);
            carry += getCreepBodyNum(creep, CARRY);
        }
    });
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

export function getBodyCost(body: BodyPartConstant[]) {
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
    creep: Creep,
    filter?: FilterFunction<K>,
    types?: StructureConstant[]
): Array<FindTypes[K]> {
    let _types = [
        STRUCTURE_SPAWN,
        STRUCTURE_EXTENSION,
        STRUCTURE_TOWER,
        STRUCTURE_CONTAINER,
        STRUCTURE_STORAGE,
    ];
    let struct = types || _types;
    const targets = creep.room.find(FIND_STRUCTURES);

    for (let i = 0; i < struct.length; i++) {
        let ck = targets.filter(t => {
            let meet_type = t.structureType === struct[i];
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
export function isTargetNearSource(creep: Creep, target: any) {
    if (target.structureType !== STRUCTURE_CONTAINER) {
        return false;
    }
    return creep.room.sourceInfo.find(s => s.container?.id === target?.id);
}

export function findRepairTarget(room: Room, types?: any[] | null, excludes?: any[]): AnyStructure {
    console.log('find ss');
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
            console.log('hits', a.hits, a.hitsMax);
            return a.hits - b.hits;
        });
    return targets.shift();
}

export function findTargetAttack(room: Room) {
    let target = room.find(FIND_HOSTILE_CREEPS);
    return target.pop();
}
