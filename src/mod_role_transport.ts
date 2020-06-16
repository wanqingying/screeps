import {
    findNearTarget,
    is_empty_tate,
    is_full_tate,
    isContainerNearController,
    isContainerNearSource,
    run_creep,
    run_my_room,
} from './lib_base';
import { moveToTarget } from './lib_creep';
// 游戏的核心物流调度
// 设计目标 1保证基地的房间资源正常周转 2尽最大可能提高资源运转效率
// 不包括外矿的资源(接入很简单 但是浪费cpu) 外矿直接运回自己基地接入物流即可

const HarvesterSite = 'harvester_container';
const ControllerSite = 'controller_container';
const DropSite = 'drop';
// only for in , not out
const AnySource = 'any';
// any 表示任意资源
type resType = ResourceConstant | typeof AnySource;
type strType = StructureConstant | typeof DropSite | typeof HarvesterSite | typeof ControllerSite;

interface CacheRoom {
    tick: number;
    transIn: TransList;
    transOut: TransList;
    spawning: boolean;
}

// 1 资源来源 比如建筑等 发布(刷新) 资源需求和资源运输任务 到任务池
// 2 单位从任务池接收任务
// 3 单位完成任务
// 4 重复以上步骤
// 单位资源存量大于x后 单位会倾向于卸货 0:有资源就卸货,1:只有装满才会卸货
// 单位可以接多个任务

// 发布任务的最小数量,小于此数量不发布运输任务 目前适用于 drop 防止反复捡
const minAmo = 40;
// 调度优先级 0-100
// todo 支持自定义调度 callback
const w_out = {
    // 丢地上的
    drop: 100,
    // 矿区容器
    harvester_container: 90,
    // 升级用的容器
    controller_container: 20,
    [STRUCTURE_STORAGE]: 30,
    [STRUCTURE_SPAWN]: 4,
    [STRUCTURE_TOWER]: 0,
    [STRUCTURE_EXTENSION]: 9,
    [STRUCTURE_CONTAINER]: 40,
};
const w_in = {
    drop: 0,
    harvester_container: 0,
    controller_container: 60,
    [STRUCTURE_STORAGE]: 30,
    [STRUCTURE_SPAWN]: 90,
    [STRUCTURE_TOWER]: 80,
    [STRUCTURE_EXTENSION]: 99,
    [STRUCTURE_CONTAINER]: 50,
};
const cache_creep_task = {} as any;
if (!global.w_cache) {
    global.w_cache = new Map<any, any>();
}

interface CacheCreep {
    creep_id?: string;
    mod?: 'in' | 'out';
    // task pool
    tasks: TransTask[];
    // current handle
    precessTask?: TransTask;
}

interface CacheRoom {
    tick: number;
    transIn: TransList;
    transOut: TransList;
    spawning: boolean;
}

class TransportDriver {
    private updateTick = 0;
    private last_run_time = 0;
    constructor() {}
    private cache_creep: Map<string, CacheCreep> = new Map();
    private cache_room: Map<string, CacheRoom> = new Map<string, CacheRoom>();
    private getRoomCache = (room: Room) => {
        let che = this.cache_room.get(room.name);
        if (!che) {
            che = {
                tick: Game.time,
                transIn: new TransList('in'),
                transOut: new TransList('out'),
                spawning: !!room.memory.spawning_role,
            };
            this.cache_room.set(room.name, che);
        }
        return che;
    };
    private getCreepCache = (creep: Creep) => {
        let che = this.cache_creep.get(creep.id);
        if (!che) {
            che = {
                creep_id: creep.id,
                tasks: [],
                precessTask: undefined,
            };
            this.cache_creep.set(creep.id, che);
        }
        return che;
    };
    private getCreepHandleTask = (creep: Creep) => {
        const creepCache = this.getCreepCache(creep);
        if (creepCache.precessTask) {
            return creepCache.precessTask;
        }
        const currentTask = creepCache.tasks.shift();
        creepCache.precessTask = currentTask;
        return currentTask;
    };
    private rememberCreepTask = (creep: Creep, tasks: TransTask[]) => {
        const creepCache = this.getCreepCache(creep);
        creepCache.tasks = tasks;
    };
    private closeCreepTask = (creep: Creep) => {
        const creepCache = this.getCreepCache(creep);
        let task = creepCache.precessTask;
        creepCache.precessTask = undefined;
        task.amount = task.amount_rec = 0;
    };
    private receiveTask = (creep: Creep, handle?: 'give' | 'get', structures?: any[]) => {
        const che = this.getRoomCache(creep.room);
        if (this.updateTick !== Game.time) {
            this.updateState();
        }
        let tasks: TransTask[];
        if (is_full_tate(creep)) {
            creep.memory.trans_direct = 'in';
        }
        if (is_empty_tate(creep)) {
            creep.memory.trans_direct = 'out';
        }
        let direct = creep.memory.trans_direct;
        if (handle === 'give') {
            direct = 'in';
        }
        if (handle === 'get') {
            direct = 'out';
        }
        if (direct === 'out') {
            tasks = che.transOut.getTask(creep, structures);
            // if (!tasks && used > 0) {
            //     //没接到卸货任务且装有资源时 尝试接资源需求任务
            //     tasks = che.transIn.getTask(creep, structures);
            // }
        } else {
            tasks = che.transIn.getTask(creep, structures);
            // if (!tasks && free > 0) {
            //     //没接到资源需求任务且有空间时 尝试接卸货任务
            //     tasks = che.transOut.getTask(creep, structures);
            // }
        }
        this.rememberCreepTask(creep, tasks);
    };
    private run_transport = (creep: Creep, handle?: 'give' | 'get', structures?: any[]) => {
        let task: TransTask = this.getCreepHandleTask(creep);
        if (task) {
            return this.run_task(creep, task);
        }
        this.receiveTask(creep, handle, structures);
        task = this.getCreepHandleTask(creep);

        if (!task) {
            creep.say('no task');
            return ERR_NOT_FOUND;
        } else {
            return this.run_task(creep, task);
        }
    };
    private run_task = (creep: Creep, task: TransTask) => {
        if (task.trans_dec === 'in' && is_empty_tate(creep)) {
            // 运入建筑 单位没有资源重置
            this.closeCreepTask(creep);
            return;
        }

        if (task.trans_dec === 'out' && is_full_tate(creep)) {
            // 从建筑运出 如果单位已满则重置任务
            return this.closeCreepTask(creep);
        }

        const [x, y, name] = task.pos;
        const pos = new RoomPosition(x, y, name);

        let code;
        const target = Game.getObjectById(task.id) as any;

        const far = moveToTarget(creep, target);

        if (far > 3) {
            return;
        }

        if (task.trans_dec === 'in') {
            const type = task.resType;
            if (type === 'any') {
                RESOURCES_ALL.forEach(t => {
                    if (creep.store[t] > 0) {
                        code = creep.transfer(target, t);
                    }
                });
            } else {
                code = creep.transfer(target, type);
            }
        }

        if (task.trans_dec === 'out') {
            if (task.stcType === 'drop') {
                code = creep.pickup(target as Resource);
            } else {
                code = creep.withdraw(target, task.resType as any);
            }
        }
        switch (code) {
            case ERR_NOT_IN_RANGE:
                moveToTarget(creep, pos);
                break;
            case OK:
                updateTask(creep, task);
                break;
            default:
            // closeTask(creep,task)
        }
        this.finishTask(creep, task);
    };
    private finishTask = (creep: Creep, task: TransTask) => {
        let task_done = false;
        if (task.trans_dec === 'in') {
            // 卸载任务完成
            if (is_empty_tate(creep)) {
                task_done = true;
            }
            if (task.amount_rec >= task.amount) {
                task_done = true;
            }
        }
        if (task.trans_dec === 'out') {
            // 装运任务完成
            if (is_full_tate(creep)) {
                task_done = true;
            }
            if (task.amount_rec >= task.amount) {
                task_done = true;
            }
        }
        if (task_done) {
            this.closeCreepTask(creep);
        }
    };
    private publicTask = (room: Room) => {
        const che = this.getRoomCache(room);
        che.spawning = !!room.memory.spawning_role;
        const structures = room.findBy(FIND_STRUCTURES);
        // drop=============================================
        room.find(FIND_DROPPED_RESOURCES).forEach(resource => {
            if (resource.amount < minAmo) {
                return;
            }
            let task = generateTask('out', resource as any, {
                amount: resource.amount,
                resourceType: resource.resourceType,
                structureType: 'drop',
            });
            che.transOut.updateTask(task);
        });
        room.find(FIND_TOMBSTONES).forEach(tom => {
            RESOURCES_ALL.forEach(type => {
                const used = tom.store.getUsedCapacity(type);
                if (used > 0) {
                    const taskOut = generateTask('out', tom as any, {
                        amount: used,
                        resourceType: type,
                        structureType: 'drop',
                    });
                    che.transOut.updateTask(taskOut);
                }
            });
        });
        // storage===========================
        const storage = room.storage;
        if (storage && storage.my) {
            // 需要优化
            RESOURCES_ALL.forEach(type => {
                const used = storage.store.getUsedCapacity(type);
                if (used > 0) {
                    const taskOut = generateTask('out', storage, {
                        amount: used,
                        resourceType: type,
                    });
                    che.transOut.updateTask(taskOut);
                }
            });
            const free = storage.store.getFreeCapacity();

            const taskIn: TransTask = generateTask('in', storage, {
                amount: free,
                resourceType: 'any',
            });
            che.transIn.updateTask(taskIn);
        }
        // spawn extension===================
        Array.from(structures)
            .filter(s => [STRUCTURE_SPAWN, STRUCTURE_EXTENSION].includes((s as any).structureType))
            .forEach((s: StructureSpawn) => {
                const used = s.store.getUsedCapacity(RESOURCE_ENERGY);
                const free = s.store.getFreeCapacity(RESOURCE_ENERGY);
                if (used > 0) {
                    che.transOut.updateTask(
                        generateTask('out', s, { amount: used, resourceType: RESOURCE_ENERGY })
                    );
                }
                if (free > 0) {
                    che.transIn.updateTask(
                        generateTask('in', s, { amount: free, resourceType: RESOURCE_ENERGY })
                    );
                }
            });
        // container=========================
        Array.from(structures as any)
            .filter(s => {
                return (s as any).structureType === STRUCTURE_CONTAINER;
            })
            .forEach((s: StructureContainer) => {
                let stc: strType = s.structureType;
                if (isContainerNearSource(room, s)) {
                    stc = 'harvester_container';
                }
                if (isContainerNearController(room, s)) {
                    stc = 'controller_container';
                }
                RESOURCES_ALL.forEach(type => {
                    const used = s.store.getUsedCapacity(type);
                    if (used > 0) {
                        const taskOut = generateTask('out', s, {
                            amount: used,
                            resourceType: type,
                            structureType: stc,
                        });
                        che.transOut.updateTask(taskOut);
                    }
                });
                const free = s.store.getFreeCapacity();
                if (stc !== 'harvester_container') {
                    const taskIn: TransTask = generateTask('in', s, {
                        amount: free,
                        resourceType: 'any',
                        structureType: stc,
                    });
                    che.transIn.updateTask(taskIn);
                }
            });
        // tower
        Array.from(structures)
            .filter(s => s.structureType === STRUCTURE_TOWER)
            .forEach((s: StructureTower) => {
                const free = s.store.getFreeCapacity(RESOURCE_ENERGY);
                if (free > 0) {
                    che.transIn.updateTask(
                        generateTask('in', s, { amount: free, resourceType: RESOURCE_ENERGY })
                    );
                }
            });
    };
    public updateState = () => {
        this.updateTick = Game.time;
        run_my_room(room => {
            this.publicTask(room);
        });
    };
    public tryUpdateState = (force?: boolean) => {
        if (force) {
            this.updateState();
            return;
        }
        if (Game.time - this.updateTick > 50) {
            this.updateState();
            return;
        }
    };
    public run = () => {
        this.last_run_time = Game.time;
        this.tryUpdateState();
        run_creep(w_role_name.carrier, creep => {
            try {
                this.run_transport(creep);
            } catch (e) {
                console.log('err run_transport ', creep.name);
                console.log(e.message);
                console.log(e.stack);
            }
        });
    };
    public static start = () => {
        let driver: TransportDriver = w_cache.get(TransportDriver.cache_key);
        if (!driver) {
            driver = new TransportDriver();
            w_cache.set(TransportDriver.cache_key, driver);
        }
        driver.run();
    };
    public static get_resource = (creep: Creep) => {
        let driver: TransportDriver = w_cache.get(TransportDriver.cache_key);
        if (!driver) {
            driver = new TransportDriver();
            w_cache.set(TransportDriver.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.run();
        }
        driver.run_transport(creep, 'get');
    };
    public static give_resource = (creep: Creep) => {
        let driver: TransportDriver = w_cache.get(TransportDriver.cache_key);
        if (!driver) {
            driver = new TransportDriver();
            w_cache.set(TransportDriver.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.run();
        }
        driver.run_transport(creep, 'give');
    };
    private static cache_key = w_code.DRIVER_KEY_TRANSPORT;
}
// 计算本次处理的数量 更新任务状态 todo 待观察
function updateTask(creep: Creep, task: TransTask) {
    task.amount = task.amount_rec = 0;
}

// 关闭任务
function closeTask(creep: Creep, task: TransTask) {
    delete cache_creep_task[creep.name];
    task.amount = task.amount_rec = 0;
}

interface Cop {
    pos: { x: number; y: number; roomName: string };
    id: string;
    task: TransTask;
}
class TransList {
    private readonly trans_dec: 'in' | 'out';
    private task_count = 0;
    private readonly ws: typeof w_in;
    constructor(dec: 'in' | 'out') {
        this.trans_dec = dec;
        if (this.trans_dec === 'in') {
            this.ws = w_in;
        } else {
            this.ws = w_out;
        }
    }
    private array: TransTask[] = [];
    public updateTask = (task: TransTask) => {
        if (task.w === 0) {
            return;
        }
        this.task_count++;
        const id = `${this.trans_dec}_${this.task_count}`;
        // 每 tick 都会更新任务数量
        const task_exist = this.array.find(t => t.id === task.id);
        if (task_exist) {
            task_exist.amount = task.amount;
        } else {
            task.trans_dec = this.trans_dec;
            task.trans_id = id;
            this.array.push(task);
        }
    };
    // structures 偏好的建筑类型
    public getTask = (creep: Creep, structures?: string[]): TransTask[] => {
        let spawning = !!creep.room.memory.spawning_role;
        let ws = this.ws;
        let max_w = 0;
        // 优先的建筑不存在 则无效
        // 如果存在优先建筑 就从优先建筑里取任务
        let prior_structure = 0;
        let bs = Array.from(this.array).filter(a => {
            // 筛选未完成的任务amount<amount_rec
            if (a.amount <= a.amount_rec) {
                return false;
            }
            // 生产中的母巢停止出资源
            if (
                spawning &&
                [STRUCTURE_SPAWN, STRUCTURE_EXTENSION].includes(a.stcType as any) &&
                this.trans_dec === 'out'
            ) {
                return false;
            }
            const wa = ws[a.stcType];
            // 统计最高权重
            if (wa > max_w) {
                max_w = wa;
            }
            // 统计优先建筑数量
            if (structures && structures.includes(a.stcType)) {
                prior_structure += 1;
            }
            return true;
        });
        bs = bs.filter(s => {
            const wa = ws[s.stcType];

            if (prior_structure > 0) {
                // 筛选优先的
                if (structures.includes(s.stcType)) {
                    return true;
                }
            } else {
                // 筛选权重最高的
                if (wa === max_w) {
                    return true;
                }
            }
            return false;
        });

        let task_pool: Cop[] = Array.from(bs).map(t => {
            return { pos: { x: t.pos[0], y: t.pos[1], roomName: t.pos[2] }, id: t.id, task: t };
        });
        if (task_pool.length === 0) {
            return [];
        }
        let next: Cop = findNearTarget<Cop>(creep, task_pool);
        task_pool = task_pool.filter(t => t.id !== next.id);
        let near_task: TransTask = next.task;
        // 一次处理多个任务
        let final_list = [near_task];
        let resType = near_task.resType;
        let max_rec = 0;
        if (this.trans_dec === 'in') {
            if (resType === 'any') {
                // ignore
            } else {
                max_rec = creep.store.getUsedCapacity(resType);
            }
        }
        if (this.trans_dec === 'out') {
            max_rec = creep.store.getFreeCapacity();
        }
        let rec_left = max_rec - near_task.amount;
        while (rec_left >= 50 && task_pool.length > 0) {
            next = findNearTarget(creep, task_pool);
            near_task = next.task;
            final_list.push(near_task);
            task_pool = task_pool.filter(t => t.id !== next.id);
            rec_left = rec_left - near_task.amount;
        }
        final_list.forEach(t => {
            this.addRecord(creep, t);
        });
        return final_list;
    };
    public addRecord = (creep: Creep, task: TransTask) => {
        if (this.trans_dec === 'out') {
            task.amount_rec += creep.store.getFreeCapacity();
        }
        if (this.trans_dec === 'in') {
            if (task.resType === 'any') {
                let rec = 0;
                RESOURCES_ALL.forEach(t => {
                    rec += creep.store[t];
                });
                task.amount_rec += rec;
            } else {
                task.amount_rec += creep.store.getUsedCapacity(task.resType);
            }
        }
    };
    public getTaskById = (creep: Creep, id?: string): TransTask => {
        let task = this.array.find(t => t.trans_id === id);
        if (task) {
            this.addRecord(creep, task);
        }
        return task;
    };
}

interface TransTask {
    // 任务发布数量
    amount: number;
    // 单位处理中的数量
    amount_rec: number;
    // 发布任务的目标位置
    pos: any[];
    // 发布任务的目标 id
    id: string;
    // 资源类型
    resType: resType;
    // 权重系数,用于任务优先级调度
    w: number;
    // 建筑类型
    stcType: strType;
    // 资源需求任务或者资源清空任务
    trans_dec?: 'in' | 'out';
    // 任务 id
    trans_id?: string;
}

interface GenTask {
    amount: number;
    resourceType: resType;
    structureType?: strType;
}
function generateTask(
    dec: 'in' | 'out',
    structure: AnyStructure,
    { amount, resourceType, structureType }: GenTask
) {
    const pos = [structure.pos.x, structure.pos.y, structure.pos.roomName];
    const type = structureType || structure?.structureType;
    let ws;
    if (dec === 'in') {
        ws = w_in;
    }
    if (dec === 'out') {
        ws = w_out;
    }
    return {
        id: structure.id,
        amount: amount,
        pos,
        amount_rec: 0,
        w: ws[type],
        resType: resourceType,
        stcType: type,
    } as TransTask;
}
