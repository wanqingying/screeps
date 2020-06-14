import { isCreepStop, moveToTarget } from './lib_creep';
import {
    findNearTarget,
    isContainerNearController,
    isContainerNearSource,
    isEmpty,
    isFull,
} from './lib_base';

type resType = ResourceConstant | 'any';
type strType = StructureConstant | 'drop' | 'harvester_container' | 'controller_container';
// 资源清空任务
interface TransTask {
    amount: number;
    // 单位处理中的数量
    amount_rec: number;
    pos: any[];
    id: string;
    resourceType: resType;
    // 权重系数,用于任务优先级调度
    w: number;
    structureType: strType;
    trans_dec?: 'in' | 'out';
    trans_id?: string;
}
interface CacheRoom {
    tick: number;
    transIn: TransList;
    transOut: TransList;
    spawning: boolean;
}

// 1 资源来源 比如建筑等 发布(刷新)资源需求和资源运输任务
// 2 单位接收任务
// 3 单位完成任务
// 单位资源存量大于x后 单位会倾向于卸货 0:有资源就卸货,1:只有装满才会卸货
// 单位可以接多个任务
const FULL_RATE = 0.9;
// 发布任务的最小数量,小于此数量不发布运输任务 目前适用于 drop 防止反复捡
const minAmo = 40;
// 接收任务的最小空间,小于此空间不接收任务
const minCap = 40;
// 调度优先级 0-100
const w_out = {
    // 丢地上的
    drop: 100,
    // 矿区容器
    harvester_container: 90,
    // 升级用的容器
    controller_container: 40,
    [STRUCTURE_STORAGE]: 30,
    [STRUCTURE_SPAWN]: 4,
    [STRUCTURE_TOWER]: 0,
    [STRUCTURE_EXTENSION]: 9,
    [STRUCTURE_CONTAINER]: 40,
};
const w_in = {
    drop: 0,
    harvester_container: 0,
    controller_container: 50,
    [STRUCTURE_STORAGE]: 30,
    [STRUCTURE_SPAWN]: 90,
    [STRUCTURE_TOWER]: 80,
    [STRUCTURE_EXTENSION]: 100,
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
        let che = getCache(creep.room);
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
            // 生产中的母巢不能出资源
            if (
                che.spawning &&
                [STRUCTURE_SPAWN, STRUCTURE_EXTENSION].includes(a.structureType as any) &&
                this.trans_dec === 'out'
            ) {
                console.log('can not get from spawn when spawning');
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

            // 筛选优先的
            if (prior_structure > 0) {
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
            return { pos: { x: t.pos[0], y: t.pos[1] }, id: t.id };
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
            this.addRecord(creep, task);
        }
        return task;
    };
}

const cache: { [name: string]: CacheRoom } = {};

// 启动物流系统
export function load_distribution_transport() {
    Object.values(Game.rooms).forEach(room => {
        if (room.controller?.my) {
            try {
                prepareCacheRoom(room);
            } catch (e) {
                console.log('err load_distribution_transport ', room.name);
                console.log(e.message);
                console.log(e.stack);
            }
            room.find(FIND_MY_CREEPS).forEach(creep => {
                if (isCreepStop(creep)) {
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

function is_empty_tate(creep: Creep) {
    const free = creep.store.getFreeCapacity();
    const cap = creep.store.getCapacity();
    const used = cap - free;
    if (used / cap < 1 - FULL_RATE) {
        return true;
    }
    return false;
}
function is_full_tate(creep: Creep) {
    const free = creep.store.getFreeCapacity();
    const cap = creep.store.getCapacity();
    const used = cap - free;
    if (used / cap > FULL_RATE) {
        return true;
    }
}
// 物流运输单位逻辑
function run_transport(creep: Creep, sop?: 'get' | 'give', structures?: any[]) {
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

    let swh = cache_creep_switch[creep.name];
    if (is_full_tate(creep)) {
        swh = cache_creep_switch[creep.name] = 'in';
    }
    if (is_empty_tate(creep)) {
        swh = cache_creep_switch[creep.name] = 'out';
    }
    if (sop === 'give') {
        swh = 'in';
    }
    if (sop === 'get') {
        swh = 'out';
    }

    if (swh === 'out') {
        task = che.transOut.getTask(creep, structures);
        if (!task && used > 0) {
            task = che.transIn.getTask(creep, structures);
        }
    } else {
        task = che.transIn.getTask(creep, structures);
        if (!task && free > 0) {
            task = che.transOut.getTask(creep, structures);
        }
    }

    if (!task) {
        console.log('no task get');
        return ERR_NOT_FOUND;
    }
    cache_creep_task[creep.name] = task.trans_id;
    debugger;
    creep.memory.obj = task;
    return run_task(creep, task);
}

// 从物流中获取物资
export function get_resource(creep: Creep, structures?: string[]) {
    creep.memory.process = 'get_transport';
    run_transport(creep, 'get', structures);
}
// 存放物资
export function give_resource(creep: Creep, structures?: string[]) {
    creep.memory.process = 'give_transport';
    run_transport(creep, 'give', structures);
}

// 执行物流任务
function run_task(creep: Creep, task: TransTask) {
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
    if (code === ERR_NOT_IN_RANGE) {
        moveToTarget(creep, pos);
    }
    console.log('run task ', w_utils.get_code_msg(code));
    checkTaskIsComplete(creep, task);
}

function checkTaskIsComplete(creep: Creep, task: TransTask) {
    if (task.trans_dec === 'in') {
        let type = task.resourceType === 'any' ? undefined : task.resourceType;
        // 卸载任务完成
        if (isEmpty(creep, type)) {
            delete cache_creep_task[creep.name];
            task.amount = task.amount_rec = 0;
            creep.memory.process = null;
            return true;
        }
        if (task.amount_rec >= task.amount) {
            delete cache_creep_task[creep.name];
            task.amount = task.amount_rec = 0;
            creep.memory.process = null;
            return true;
        }
    }
    if (task.trans_dec === 'out') {
        // 装运任务完成
        if (isFull(creep)) {
            delete cache_creep_task[creep.name];
            task.amount = task.amount_rec = 0;
            creep.memory.process = null;
            return true;
        }
        if (task.amount_rec >= task.amount) {
            delete cache_creep_task[creep.name];
            task.amount = task.amount_rec = 0;
            creep.memory.process = null;
            return true;
        }
    }
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
    const st = structure?.structureType || structureType;
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
        w: ws[st],
        resourceType: resourceType,
        structureType: st,
    } as TransTask;
}

function log_task(task: TransTask) {
    let roomName = task.pos[2];
    if (roomName === 'W1N7') {
        console.log(
            `structureTYpe=${task.structureType} amount=${task.amount} amount_rec=${task.amount_rec} trans_dec=${task.trans_dec}`
        );
    }
}
