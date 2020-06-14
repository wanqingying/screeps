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
    }

    if (cache_id) {
        target = Game.getObjectById(cache_id);
    } else {
        target = getTarget();
        // if (tickLimit && target) {
        //     setTickOut(tickLimit, reset);
        // }
        if (target) {
            w_cache.set(cache_key, target?.id);
        }
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

// 用于spawn计算消耗
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

const FULL_RATE = 0.85;

export function is_empty_tate(creep: Creep) {
    const free = creep.store.getFreeCapacity();
    const cap = creep.store.getCapacity();
    const used = cap - free;
    return used / cap < 1 - FULL_RATE;
}
export function is_full_tate(creep: Creep) {
    const free = creep.store.getFreeCapacity();
    const cap = creep.store.getCapacity();
    const used = cap - free;
    return used / cap > FULL_RATE;
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
export function isContainerNearSource(room: Room, target: StructureContainer) {
    if (target.structureType !== STRUCTURE_CONTAINER) {
        return false;
    }
    let mats = getSourceWithContainer(room);
    return !!mats?.find(s => s.container?.id === target?.id);
}
//
export function isContainerNearController(room: Room, target: StructureContainer) {
    if (target.structureType !== STRUCTURE_CONTAINER) {
        return false;
    }
    if (!room.controller) {
        return false;
    }
    let far = w_utils.count_distance(target, room.controller);
    return far < 2;
}
// 用于 creep name
export function getCreepIndex() {
    const mk = Object.values(Game.creeps).map(k => k.memory.index);
    for (let i = 0; i < mk.length + 1; i++) {
        if (!mk.includes(i)) {
            return i;
        }
    }
}

export function findRepairTargetC(
    creep: Creep,
    types?: any[] | null,
    excludes?: any[]
): AnyStructure {
    let min_hit = 99;
    let targets = creep.room
        .findBy(FIND_STRUCTURES, t => {
            if (types && types.length && !types.includes(t.structureType)) {
                return false;
            }
            if (excludes && excludes.length && excludes.includes(t.structureType)) {
                return false;
            }
            if (t.hits / t.hitsMax < min_hit) {
                min_hit = t.hits / t.hitsMax;
            }
            return t.hits < (t.hitsMax * 4) / 5;
        })
        .filter(a => {
            return a.hits / a.hitsMax <= min_hit + 0.01;
        });
    return findNearTarget(creep, targets);
}
export function findRepairTarget(room: Room, types?: any[] | null, excludes?: any[]): AnyStructure {
    let targets = room
        .findBy(FIND_STRUCTURES, t => {
            if (types && types.length && !types.includes(t.structureType)) {
                return false;
            }
            if (excludes && excludes.length && excludes.includes(t.structureType)) {
                return false;
            }
            return t.hits < (t.hitsMax * 4) / 5;
        })
        .sort((a, b) => {
            return a.hits - b.hits;
        });
    return targets.shift();
}

// 获取房间内 source 和旁边 container 配对信息
export function getSourceWithContainer(
    room: Room
): { source: Source; container: StructureContainer | undefined }[] {
    const containers = room.findBy(FIND_STRUCTURES, t => t.structureType === STRUCTURE_CONTAINER);
    return room.find(FIND_SOURCES).map(source => {
        const near_container = findNearTarget(source, containers) as StructureContainer;
        const far = w_utils.count_distance(near_container?.pos, source?.pos);
        if (far <= 2 && near_container) {
            return { source: source, container: near_container };
        } else {
            return { source: source, container: undefined };
        }
    });
}
