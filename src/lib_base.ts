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

const FULL_RATE = 0.9;

export function is_empty_tate(creep: Creep, rate?: number) {
    const percent = rate || FULL_RATE;
    const free = creep.store.getFreeCapacity();
    const cap = creep.store.getCapacity();
    const used = cap - free;
    return used / cap <= 1 - percent;
}
export function is_full_tate(creep: Creep, rate?: number) {
    const percent = rate || FULL_RATE;
    const free = creep.store.getFreeCapacity();
    const cap = creep.store.getCapacity();
    const used = cap - free;
    return used / cap >= percent;
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

interface RemoteTransportTask {
    from: string;
    remote: string;
    id: string;
    resourceType: ResourceConstant;
    structureType: string;
    amount: number;
    amountRec: number;
    pos: RoomPosition;
}

export class RemoteTransport {
    private array: RemoteTransportTask[] = [];
    private resType = RESOURCE_ENERGY;
    public updateResource = (newRes: RemoteTransportTask) => {
        const prev = this.array.find(b => b.id === newRes.id);
        if (prev) {
            prev.amount = newRes.amount;
        } else {
            this.array.push(newRes);
        }
    };
    public getTask = (creep: Creep): RemoteTransportTask => {
        console.log('get task');
        console.log(creep.name);
        console.log(creep.memory.remote_task_id);
        if (creep.memory.remote_task_id) {
            const task = this.getTaskById(creep.memory.remote_task_id);
            // if (task.amount > 200) {
            //     task.amountRec += creep.store.getFreeCapacity(this.resType);
            //     return task;
            // }
            return task;
        }

        const { from } = creep.memory;

        let max = 0;
        let max_task: RemoteTransportTask = {} as any;
        this.array.forEach(s => {
            let a = s.from === from;
            let b = s.amount > 200;
            if (a && b) {
                max = s.amount - s.amountRec;
                max_task = s;
                return true;
            }
            return false;
        });
        if (max > 200) {
            max_task.amountRec += creep.store.getFreeCapacity(this.resType);
            return max_task;
        }
        return max_task
    };
    public forgetTask = creep => {
        creep.memory.remote_task_id = undefined;
    };
    public getRoomTask = (room: Room): RemoteTransportTask[] => {
        return this.array.filter(t => t.from === room.name);
    };
    private getTaskById = (id: string): RemoteTransportTask => {
        return this.array.find(t => t.id === id);
    };
}

interface RemoteMineTask {
    from: string;
    remote: string;
    id: string;
    container_id: string;
    creep_id: string;
}

export class RemoteMine {
    private array: RemoteMineTask[];
    constructor() {
        this.array = [];
        Object.keys(w_config.rooms).forEach(name => {
            let cfg_room = w_config.rooms[name];
            let reserves = cfg_room.reserve || {};

            Object.keys(reserves).forEach(_name => {
                let s = reserves[_name];
                s.forEach(u => {
                    this.array.push({
                        id: u.id,
                        container_id: u.container_ids,
                        from: name,
                        remote: _name,
                        creep_id: '',
                    });
                });
            });
        });
    }
    public updateState = () => {
        run_creep(w_role_name.remote_harvester, creep => {
            if (creep.memory.remote_task_id) {
                let task = this.getTaskById(creep.memory.remote_task_id);
                if (task && creep.ticksToLive > 150) {
                    task.creep_id = creep.id;
                }
            }
        });
    };
    public getTask = (creep: Creep): RemoteMineTask | undefined => {
        let e_id = creep.memory.remote_task_id;
        if (e_id) {
            let prev = this.getTaskById(e_id);
            if (prev) {
                return prev;
            }
        }
        const from = creep.memory.from;
        const task = this.array.find(t =>  {
            if (t.from!==from){
                return false
            }
            if (t.creep_id){
                // 接班 死掉的 或者将要死掉的
                let cp:Creep=Game.getObjectById(t.creep_id);
                if (!cp){
                    return true
                }
                if (cp.ticksToLive<200){
                    return true
                }
                return false
            }else{
                // 一个矿安排一个
                return true
            }
        });
        if (task) {
            task.creep_id = creep.id;
            creep.memory.remote_task_id = task.id;
        }
        return task;
    };
    public forgetTask = (creep:Creep) => {
        let t_id=creep.memory.remote_task_id
        creep.memory.remote_task_id=undefined;
        if (t_id){
            let task=this.getTaskById(t_id)
            if (task){
                task.creep_id=undefined
            }
        }
    };
    private getTaskById = (id: string) => {
        return this.array.find(t => t.id === id);
    };
}

export function run_creep(
    role: role_name_key,
    fn: (creep: Creep) => void,
    filter?: (creep: Creep) => boolean
) {
    Object.values(Game.creeps)
        .filter(c => {
            if (c.spawning) {
                return false;
            }
            if (role && c.memory.role !== role) {
                return false;
            }
            if (filter && !filter(c)) {
                return false;
            }
            return true;
        })
        .forEach(fn);
}

export function run_my_room(fn: (room: Room) => void, filter?) {
    const rooms = Object.values(Game.rooms).filter(room => {
        if (room.controller?.my) {
            return false;
        }
        return true;
    });
    rooms.forEach(prepareCache);
    rooms.forEach(fn);
}

function prepareCache(room: Room) {}
