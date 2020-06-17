export function findAttackTarget(room: Room): Creep {
    let targets = room
        .findBy(FIND_HOSTILE_CREEPS, t => {
            return t.body.some(b => [ATTACK, RANGED_ATTACK, HEAL].includes(b.type as any));
        })
        .sort((a, b) => {
            return a.hits - b.hits;
        });
    return targets.shift();
}
export function findNearTarget<T>(base, targets: any[]): T {
    const c = base.pos || base;
    let min_far = 999;
    let target = null;
    targets.forEach(t => {
        const far = w_utils.count_distance(c, t.pos || t);
        if (far < min_far) {
            min_far = far;
            target = t;
        }
    });
    return target;
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

const FULL_RATE = 0.8;

export function is_empty_tate(creep: Creep | any, rate?: number) {
    const percent = rate || FULL_RATE;
    const free = creep.store.getFreeCapacity();
    const cap = creep.store.getCapacity();
    const used = cap - free;
    return used / cap <= 1 - percent;
}
export function is_full_tate(creep: Creep | any, rate?: number) {
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
    public updateState = () => {
        if (Game.time % 50 === 0) {
            this.array.forEach(t => (t.amountRec = 0));
        }
    };
    public updateTask = (creep: Creep) => {
        let c_id = creep.memory.remote_task_id;
        let task = this.getTaskById(c_id);
        if (task) {
            task.amountRec = 0;
        }
    };
    public getRemember = (creep: Creep) => {
        if (creep.memory.remote_task_id) {
            let task = this.getTaskById(creep.memory.remote_task_id);
            if (task && task.amount > 100) {
                return task;
            } else {
                this.forgetTask(creep);
            }
        }
    };
    public getTask = (creep: Creep): RemoteTransportTask => {
        let prev = this.getRemember(creep);
        if (prev) {
            return prev;
        }
        // 不必每tick 都更新 只需要在有新需求的时候更新
        this.updateState();

        const { from } = creep.memory;

        let max = -999;
        let max_task: RemoteTransportTask = {} as any;
        let max_amount = 0;
        let max_amount_task: RemoteTransportTask = {} as any;
        this.array.forEach(s => {
            let a = s.from === from;
            let b = s.amount > 200;
            if (s.amount > max_amount) {
                max_amount = s.amount;
                max_amount_task = s;
            }
            if (a && b) {
                let k = s.amount - s.amountRec;
                if (k > max) {
                    max = k;
                    max_task = s;
                }
            }
        });
        if (!max_task || max_task.amount < 200) {
            max_task = max_amount_task;
        }
        if (max_task) {
            creep.memory.remote_task_id = max_task.id;
            max_task.amountRec += creep.store.getFreeCapacity();
        }
        return max_task;
    };
    public forgetTask = (creep: Creep) => {
        let c_id = creep.memory.remote_task_id;
        creep.memory.remote_task_id = undefined;
        let task = this.getTaskById(c_id);
        if (task) {
            task.amountRec -= creep.store.getFreeCapacity();
        }
    };
    public getRoomTask = (room: Room): RemoteTransportTask[] => {
        return this.array.filter(t => t.from === room.name);
    };
    public stop_spawn_carry = (room: Room): boolean => {
        return this.array.filter(t => t.from === room.name && t.amount > 200).length === 0;
    };
    private getTaskById = (id: string): RemoteTransportTask => {
        return this.array.find(t => t.id === id);
    };
}

interface RemoteBuildOrRepairTask {
    from: string;
    remote: string;
    id: string;
    build?: boolean;
    repair?: boolean;
    pos: RoomPosition;
    hits?: number;
    his_max?: number;
    hits_rate?: number;
    progress?: number;
}

export class RemoteBuild {
    private array: RemoteBuildOrRepairTask[] = [];
    private resType = RESOURCE_ENERGY;
    public updateState = (newRes: RemoteBuildOrRepairTask) => {
        const prev = this.array.find(b => b.id === newRes.id);
        if (prev) {
            prev.hits = newRes.hits;
            prev.hits_rate = newRes.hits_rate;
        } else {
            this.array.push(newRes);
        }
    };
    public getTask = (creep: Creep): RemoteBuildOrRepairTask => {
        if (creep.memory.remote_task_id) {
            const task = this.getTaskById(creep.memory.remote_task_id);
        }

        const { from } = creep.memory;

        let max = 0;
        let max_task: RemoteBuildOrRepairTask = {} as any;
        // this.array.forEach(s => {
        //     let a = s.from === from;
        //     let b = s.amount > 200;
        //     if (a && b) {
        //         max = s.amount - s.amountRec;
        //         max_task = s;
        //         return true;
        //     }
        //     return false;
        // });
        // if (max > 200) {
        //     max_task.amountRec += creep.store.getFreeCapacity(this.resType);
        //     return max_task;
        // }
        return max_task;
    };
    public forgetTask = creep => {
        creep.memory.remote_task_id = undefined;
    };
    public getRoomTask = (room: Room): RemoteBuildOrRepairTask[] => {
        return this.array.filter(t => t.from === room.name);
    };
    private getTaskById = (id: string): RemoteBuildOrRepairTask => {
        return this.array.find(t => t.id === id);
    };
}

interface RemoteReserveTask {
    from: string;
    remote: string;
    creep_id: string;
    process: number;
    id: string;
}
export class RemoteReserve {
    private array: RemoteReserveTask[] = [];
    // reserve to this value
    private max_contain = 3500;
    constructor() {
        this.array = [];
        Object.keys(w_config.rooms).forEach(name => {
            let cfg_room = w_config.rooms[name];
            let reserves = cfg_room.reserve || {};
            Object.keys(reserves).forEach((_name, index) => {
                this.array.push({
                    remote: _name,
                    from: name,
                    creep_id: '',
                    process: 0,
                    id: String(index + 1),
                });
            });
        });
    }
    public updateState = () => {
        run_creep(w_role_name.remote_reserve, creep => {
            if (creep.memory.remote_task_id) {
                let task = this.array.find(t => t.id === creep.memory.remote_task_id);
                if (!task) {
                    return this.forgetTask(creep);
                }
                task.creep_id = creep.id;
            }
        });
        Object.keys(w_config.rooms).forEach(name => {
            let cfg_room = w_config.rooms[name];
            let reserves = cfg_room.reserve || {};
            Object.keys(reserves).forEach((_name, index) => {
                let room = Game.rooms[_name];
                let target = this.array.find(s => s.remote === _name);
                if (room && target) {
                    target.process = room.controller?.reservation?.ticksToEnd;
                }
            });
        });
        this.array.forEach(task => {
            let room = Game.rooms[task.remote];
            if (room && room.controller?.reservation?.ticksToEnd) {
                task.process = room.controller?.reservation?.ticksToEnd || 0;
            } else {
                task.process = 0;
            }
        });
    };
    private update_tick = 0;
    public tryUpdateState = () => {
        if (Game.time - this.update_tick > 80) {
            this.update_tick = Game.time;
            this.updateState();
        }
    };

    public getTask = (creep: Creep): RemoteReserveTask => {
        if (creep.memory.remote_task_id) {
            let prev = this.getTaskById(creep.memory.remote_task_id);
            return prev;
        }
        const { from } = creep.memory;
        const met_array = this.array.filter(t => t.from === from);
        let min_no_creep = 5500;
        let min = 5500;
        let min_task_no_creep: RemoteReserveTask = {} as any;
        let min_task: RemoteReserveTask = {} as any;
        met_array.forEach(s => {
            let b = s.process < this.max_contain;
            let c = !s.creep_id;
            if (s.process < min) {
                min = s.process;
                min_task = s;
            }
            if (b && c) {
                if (s.process < min_no_creep) {
                    min_no_creep = s.process;
                    min_task_no_creep = s;
                }
            }
        });
        if (!min_task_no_creep) {
            min_task_no_creep = min_task;
        }
        if (min_task_no_creep) {
            creep.memory.remote_task_id = min_task_no_creep.id;
        }
        return min_task_no_creep;
    };
    public forgetTask = (creep: Creep) => {
        let c_id = creep.memory.remote_task_id;
        creep.memory.remote_task_id = undefined;
        let task = this.getTaskById(c_id);
        if (task) {
            task.creep_id = '';
        }
    };
    public getRoomTask = (room: Room): RemoteReserveTask[] => {
        return this.array.filter(t => t.from === room.name);
    };
    public stop_spawn_reserve = (room: Room) => {
        const tasks = this.getRoomTask(room);
        return tasks.every(t => t.process > this.max_contain);
    };
    private getTaskById = (id: string): RemoteReserveTask => {
        return this.array.find(t => t.id === id);
    };
}

interface RemoteAttackTask {
    from: string;
    remote: string;
    id: string;
    creep_id: string;
    target: Creep;
}

export class RemoteAttack {
    private array: RemoteAttackTask[];
    constructor() {
        this.array = [];
        Object.keys(w_config.rooms).forEach(name => {
            let cfg_room = w_config.rooms[name];
            let reserves = cfg_room.reserve || {};
            Object.keys(reserves).forEach((_name, index) => {
                this.array.push({
                    remote: _name,
                    from: name,
                    creep_id: '',
                    id: String(index + 1),
                    target: null,
                });
            });
        });
    }
    public updateState = () => {
        this.array.forEach(task => {
            let room = Game.rooms[task.remote];
            if (room) {
                let target = findAttackTarget(room);
                if (target) {
                    task.target = target;
                } else {
                    task.target = undefined;
                }
            }
        });
    };
    public getTask = (creep: Creep): RemoteAttackTask | undefined => {
        let e_id = creep.memory.remote_task_id;
        if (e_id) {
            let prev = this.getTaskById(e_id);
            if (prev && prev.target) {
                return prev;
            }
        }
        const from = creep.memory.from;
        const task = this.array.find(t => {
            if (t.from !== from) {
                return false;
            }
            return t.target;
        });
        if (task) {
            task.creep_id = creep.id;
            creep.memory.remote_task_id = task.id;
        }
        return task;
    };
    public forgetTask = (creep: Creep) => {
        let t_id = creep.memory.remote_task_id;
        creep.memory.remote_task_id = undefined;
        if (t_id) {
            let task = this.getTaskById(t_id);
            if (task) {
                task.creep_id = undefined;
            }
        }
    };
    public shouldSpawnAttack = (room: Room) => {
        return this.array.find(t => t.target && t.from === room.name);
    };
    private getTaskById = (id: string) => {
        return this.array.find(t => t.id === id);
    };
}

export function run_creep(
    role: role_name_key | 'all',
    fn: (creep: Creep) => void,
    filter?: (creep: Creep) => boolean
) {
    Object.values(Game.creeps)
        .filter(c => {
            if (c.spawning) {
                return false;
            }
            if (role !== 'all' && c.memory.role !== role) {
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
        if (!room.controller?.my) {
            return false;
        }
        return true;
    });
    rooms.forEach(prepareCache);
    rooms.forEach(fn);
}

function prepareCache(room: Room) {}
