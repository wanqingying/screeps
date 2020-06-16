// 游戏的核心物流调度
// 设计目标 1保证基地的房间资源正常周转 2尽最大可能提高资源运转效率
// 不包括外矿的资源(接入很简单 但是浪费cpu) 外矿直接运回自己基地接入物流即可

import { isCreepStop, moveToTarget } from './lib_creep';
import {
    findNearTarget,
    is_empty_tate,
    is_full_tate,
    isContainerNearController,
    isContainerNearSource,
    run_creep,
} from './lib_base';

// any 表示任意资源
type resType = ResourceConstant | 'any';
type strType = StructureConstant | 'drop' | 'harvester_container' | 'controller_container';
// 运输任务任务
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
    resourceType: resType;
    // 权重系数,用于任务优先级调度
    w: number;
    // 建筑类型
    structureType: strType;
    // 资源需求任务或者资源清空任务
    trans_dec?: 'in' | 'out';
    // 任务 id
    trans_id?: string;
}
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
const cache_creep_switch = {} as any;
if (!global.w_cache) {
    global.w_cache = new Map<any, any>();
}

class TransList {
    private readonly trans_dec: 'in' | 'out';
    private task_count = 0;
    constructor(dec: 'in' | 'out') {
        this.trans_dec = dec;
    }
    private array: TransTask[] = [];
    public addTask = (task: TransTask) => {
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
    public getTask = (creep: Creep, structures?: string[]): TransTask => {
        let che: CacheGlobalRoom = global.w_cache.get(creep.room.name) || {};
        let ws: typeof w_in;
        if (this.trans_dec === 'in') {
            ws = w_in;
        } else {
            ws = w_out;
        }

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
                che.spawning_role &&
                [STRUCTURE_SPAWN, STRUCTURE_EXTENSION].includes(a.structureType as any) &&
                this.trans_dec === 'out'
            ) {
                return false;
            }
            const wa = ws[a.structureType];
            // 统计最高权重
            if (wa > max_w) {
                max_w = wa;
            }
            // 统计优先建筑数量
            if (structures && structures.includes(a.structureType)) {
                prior_structure += 1;
            }
            return true;
        });
        bs = bs.filter(s => {
            const wa = ws[s.structureType];

            if (prior_structure > 0) {
                // 筛选优先的
                if (structures.includes(s.structureType)) {
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
        const ps = Array.from(bs).map(t => {
            return { pos: { x: t.pos[0], y: t.pos[1], roomName: t.pos[2] }, id: t.id };
        });
        // 有多个就选最近的
        let near = findNearTarget(creep, ps);
        let task = bs.find(t => t.id === (near as any)?.id);
        if (task) {
            this.addRecord(creep, task);
        }
        return task;
    };
    public addRecord = (creep: Creep, task: TransTask) => {
        if (this.trans_dec === 'out') {
            task.amount_rec += creep.store.getFreeCapacity();
        }
        if (this.trans_dec === 'in') {
            if (task.resourceType === 'any') {
                let rec = 0;
                RESOURCES_ALL.forEach(t => {
                    rec += creep.store[t];
                });
                task.amount_rec += rec;
            } else {
                task.amount_rec += creep.store.getUsedCapacity(task.resourceType);
            }
        }
    };
    public getTaskById = (creep: Creep, id?: string): TransTask => {
        let task = this.array.find(t => t.trans_id === id);
        if (task) {
            // this.addRecord(creep, task);
        }
        return task;
    };
    // 重设任务状态，修正不可控因素的影响 比如单位死亡
    // 重设的周期待观察 需要保证处理边界情况
    public resetAmountRec = () => {
        if (Game.time % 300 === 0) {
            this.array.forEach(t => (t.amount_rec = 0));
            Object.keys(cache_creep_task).forEach(k => delete cache_creep_task[k]);
        }
    };
}

const cache: { [name: string]: CacheRoom } = {};

// 加载物流系统
export function load_distribution_transport() {
    Object.values(Game.rooms).forEach(room => {
        if (room.controller?.my) {
            try {
                // 任务是否实时刷新 待定
                // if (Game.time%5===0){
                //     prepareCacheRoom(room);
                // }
                prepareCacheRoom(room);
            } catch (e) {
                console.log('err load_distribution_transport ', room.name);
                console.log(e.message);
                console.log(e.stack);
            }
            room.find(FIND_MY_CREEPS).forEach(creep => {
                if (creep.spawning) {
                    return;
                }
                if (creep.memory?.role !== w_role_name.carrier) {
                    return;
                }
                try {
                    run_transport(creep);
                } catch (e) {
                    console.log('err run_transport ', creep.name);
                    console.log(e.message);
                    console.log(e.stack);
                }
            });
            tryResetTaskAmount(room);
        }
    });
}

function getCache(room: Room) {
    let che = cache[room.name];
    if (!che?.tick) {
        che = {
            tick: Game.time,
            transIn: new TransList('in'),
            transOut: new TransList('out'),
            spawning: false,
        };
        cache[room.name] = che;
    }
    che.tick = Game.time;
    return che;
}

function prepareCacheRoom(room: Room) {
    const che = getCache(room);
    const structures = room.findBy(FIND_STRUCTURES);
    let ghe = global.w_cache.get(room.name) || {};
    che.spawning = !!ghe.spawning;
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
        che.transOut.addTask(task);
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
                che.transOut.addTask(taskOut);
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
                const taskOut = generateTask('out', storage, { amount: used, resourceType: type });
                che.transOut.addTask(taskOut);
            }
        });
        const free = storage.store.getFreeCapacity();

        const taskIn: TransTask = generateTask('in', storage, {
            amount: free,
            resourceType: 'any',
        });
        che.transIn.addTask(taskIn);
    }
    // spawn extension===================
    Array.from(structures)
        .filter(s => [STRUCTURE_SPAWN, STRUCTURE_EXTENSION].includes((s as any).structureType))
        .forEach((s: StructureSpawn) => {
            const used = s.store.getUsedCapacity(RESOURCE_ENERGY);
            const free = s.store.getFreeCapacity(RESOURCE_ENERGY);
            if (used > 0) {
                che.transOut.addTask(
                    generateTask('out', s, { amount: used, resourceType: RESOURCE_ENERGY })
                );
            }
            if (free > 0) {
                che.transIn.addTask(
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
                    che.transOut.addTask(taskOut);
                }
            });
            const free = s.store.getFreeCapacity();
            if (stc !== 'harvester_container') {
                const taskIn: TransTask = generateTask('in', s, {
                    amount: free,
                    resourceType: 'any',
                    structureType: stc,
                });
                che.transIn.addTask(taskIn);
            }
        });
    // tower
    Array.from(structures)
        .filter(s => s.structureType === STRUCTURE_TOWER)
        .forEach((s: StructureTower) => {
            const free = s.store.getFreeCapacity(RESOURCE_ENERGY);
            if (free > 0) {
                che.transIn.addTask(
                    generateTask('in', s, { amount: free, resourceType: RESOURCE_ENERGY })
                );
            }
        });
}
// 物流运输单位逻辑
function run_transport(creep: Creep, handle?: 'get' | 'give', structures?: any[]) {
    const che = getCache(creep.room);
    const free = creep.store.getFreeCapacity();
    const cap = creep.store.getCapacity();
    const used = cap - free;
    let task: TransTask;
    let cache_id: string = cache_creep_task[creep.name];
    if (cache_id) {
        let [dec] = cache_id.split('_');
        if (dec === 'in') {
            task = che.transIn.getTaskById(creep, cache_id);
        } else {
            task = che.transOut.getTaskById(creep, cache_id);
        }
    }
    if (task) {
        return run_task(creep, task);
    }

    let out_or_in = cache_creep_switch[creep.name];
    if (is_full_tate(creep)) {
        out_or_in = cache_creep_switch[creep.name] = 'in';
    }
    if (is_empty_tate(creep)) {
        out_or_in = cache_creep_switch[creep.name] = 'out';
    }
    if (handle === 'give') {
        out_or_in = 'in';
    }
    if (handle === 'get') {
        out_or_in = 'out';
    }

    if (out_or_in === 'out') {
        task = che.transOut.getTask(creep, structures);
        if (!task && used > 0) {
            //没接到卸货任务且装有资源时 尝试接资源需求任务
            task = che.transIn.getTask(creep, structures);
        }
    } else {
        task = che.transIn.getTask(creep, structures);
        if (!task && free > 0) {
            //没接到资源需求任务且有空间时 尝试接卸货任务
            task = che.transOut.getTask(creep, structures);
        }
    }
    if (!task) {
        return ERR_NOT_FOUND;
    }
    cache_creep_task[creep.name] = task.trans_id;
    creep.memory.obj = task;
    return run_task(creep, task);
}

// 从物流中获取物资
export function get_resource(creep: Creep, structures?: string[]) {
    run_transport(creep, 'get', structures);
}
// 存放物资
export function give_resource(creep: Creep, structures?: string[]) {
    run_transport(creep, 'give', structures);
}

// 执行物流任务
function run_task(creep: Creep, task: TransTask) {
    if (task.trans_dec === 'in' && is_empty_tate(creep)) {
        // 运入建筑 单位没有资源重置
        cache_creep_task[creep.name] = undefined;
        return;
    }

    if (task.trans_dec === 'out' && is_full_tate(creep)) {
        // 从建筑运出 如果单位已满则重置任务
        cache_creep_task[creep.name] = undefined;
        return;
    }
    const [x, y, name] = task.pos;
    const pos = new RoomPosition(x, y, name);

    let code;
    const target = Game.getObjectById(task.id) as any;
    if (task.trans_dec === 'in') {
        const type = task.resourceType;
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
        if (task.structureType === 'drop') {
            code = creep.pickup(target as Resource);
        } else {
            code = creep.withdraw(target, task.resourceType as any);
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
    checkTaskIsComplete(creep, task);
}

function checkTaskIsComplete(creep: Creep, task: TransTask) {
    if (task.trans_dec === 'in') {
        // 卸载任务完成
        if (is_empty_tate(creep)) {
            return closeTask(creep, task);
        }
        if (task.amount_rec >= task.amount) {
            return closeTask(creep, task);
        }
    }
    if (task.trans_dec === 'out') {
        // 装运任务完成
        if (is_full_tate(creep)) {
            return closeTask(creep, task);
        }
        if (task.amount_rec >= task.amount) {
            return closeTask(creep, task);
        }
    }
}

// 计算本次处理的数量 更新任务状态 todo 待观察
function updateTask(creep: Creep, task: TransTask) {
    // let handle_amount = 0;
    // if (task.trans_dec === 'in') {
    //     if (task.resourceType === 'any') {
    //         RESOURCES_ALL.forEach(t => {
    //             handle_amount += creep.store.getUsedCapacity(t);
    //         });
    //     } else {
    //         handle_amount = creep.store.getUsedCapacity(task.resourceType);
    //     }
    //     handle_amount = Math.min(task.amount, handle_amount);
    // }
    // if (task.trans_dec === 'out') {
    //     handle_amount = creep.store.getFreeCapacity();
    //     if (handle_amount > task.amount) {
    //         handle_amount = task.amount;
    //     }
    // }
    // task.amount_rec = task.amount_rec - handle_amount;
    task.amount_rec = 0;
    task.amount = 0;
}

// 关闭任务
function closeTask(creep: Creep, task: TransTask) {
    delete cache_creep_task[creep.name];
    task.amount = task.amount_rec = 0;
}

function tryResetTaskAmount(room) {
    const che = getCache(room);
    che.transOut.resetAmountRec();
    che.transIn.resetAmountRec();
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
        resourceType: resourceType,
        structureType: type,
    } as TransTask;
}

function log_task(task: TransTask) {
    task = task || ({ pos: [] } as any);
    console.log(
        `structureTYpe=${task.structureType} amount=${task.amount} amount_rec=${task.amount_rec} trans_dec=${task.trans_dec} [${task.pos[0]},${task?.pos[1]}]`
    );
}
