import { moveToTarget } from './lib_creep';
import { isContainerNearController, isContainerNearSource, isEmpty, isFull } from './lib_base';

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
}

// 单位资源存量大于某个值后 单位会倾向于卸货 处理资源需求任务 0:有资源就卸货,1:只有装满才会卸货
// 单位可以接多个同种资源类型的任务
const x = 0.5;
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
    controller_container: 20,
    [STRUCTURE_STORAGE]: 50,
    [STRUCTURE_SPAWN]: 0,
    [STRUCTURE_TOWER]: 0,
    [STRUCTURE_EXTENSION]: 0,
    [STRUCTURE_CONTAINER]: 30,
};
const w_in = {
    // 丢地上的
    drop: 100,
    // 矿区容器
    harvester_container: 90,
    // 升级用的容器
    controller_container: 20,
    [STRUCTURE_STORAGE]: 50,
    [STRUCTURE_SPAWN]: 0,
    [STRUCTURE_TOWER]: 0,
    [STRUCTURE_EXTENSION]: 0,
    [STRUCTURE_CONTAINER]: 30,
};
const cache_creep_task = {} as any;

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
    public getTask = (creep: Creep, structures?: StructureConstant[]): TransTask => {
        let s: typeof w_in;
        if (this.trans_dec === 'in') {
            s = w_in;
        } else {
            s = w_out;
        }
        const bs = Array.from(this.array).sort((a, b) => {
            const am = a.amount - a.amount_rec;
            const bm = b.amount - b.amount_rec;
            const ka = s[a.structureType];
            const kb = s[b.structureType];
            return am * ka - bm * kb;
        });
        let task = bs.shift();
        this.addRecord(creep, task);
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
        this.addRecord(creep, task);
        return task;
    };
    // 匹配所有任务和单位 算法复杂度 O(n2) todo 待优化
    // public matchTackWithCreeps =()=>{
    //
    // }
}

const cache: { [name: string]: CacheRoom } = {};

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
        };
        cache[room.name] = che;
    }
    return che;
}

function prepareCacheRoom(room: Room) {
    const che = getCache(room);
    const structures = room.findBy(FIND_MY_STRUCTURES);

    room.find(FIND_DROPPED_RESOURCES).forEach(resource => {
        if (resource.amount < minAmo) {
            return;
        }
        let task = generateTask(resource as any, {
            amount: resource.amount,
            resourceType: resource.resourceType,
            structureType: 'drop',
        });
        che.transOut.addTask(task);
    });
    // storage===========================
    const storage = room.storage;
    if (storage && storage.my) {
        // 需要优化
        RESOURCES_ALL.forEach(type => {
            const used = storage.store.getUsedCapacity(type);
            if (used > 0) {
                const taskOut = generateTask(storage, { amount: used, resourceType: type });
                che.transOut.addTask(taskOut);
            }
        });
        const free = storage.store.getFreeCapacity();
        const taskIn: TransTask = generateTask(storage, { amount: free, resourceType: 'any' });
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
                    generateTask(s, { amount: used, resourceType: RESOURCE_ENERGY })
                );
            }
            if (free > 0) {
                che.transOut.addTask(
                    generateTask(s, { amount: free, resourceType: RESOURCE_ENERGY })
                );
            }
        });
    // container=========================
    Array.from(structures as any)
        .filter(s => (s as any).structureType === STRUCTURE_CONTAINER)
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
                    const taskOut = generateTask(s, {
                        amount: used,
                        resourceType: type,
                        structureType: stc,
                    });
                    che.transOut.addTask(taskOut);
                }
            });
            const free = s.store.getFreeCapacity();
            const taskIn: TransTask = generateTask(s, {
                amount: free,
                resourceType: 'any',
                structureType: stc,
            });
            che.transIn.addTask(taskIn);
        });
    // tower
    Array.from(structures)
        .filter(s => s.structureType === STRUCTURE_TOWER)
        .forEach((s: StructureTower) => {
            const free = s.store.getFreeCapacity(RESOURCE_ENERGY);
            if (free > 0) {
                che.transOut.addTask(
                    generateTask(s, { amount: free, resourceType: RESOURCE_ENERGY })
                );
            }
        });
}

function run_transport(creep: Creep) {
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

    if (free > used) {
        task = che.transOut.getTask(creep);
        if (!task && used > 0) {
            task = che.transIn.getTask(creep);
        }
    } else {
        task = che.transIn.getTask(creep);
        if (!task && free > 0) {
            task = che.transOut.getTask(creep);
        }
    }
    if (!task) {
        return ERR_NOT_FOUND;
    }
    cache_creep_task[creep.name] = task.trans_id;

    return run_task(creep, task);
}

function run_task(creep: Creep, task: TransTask) {
    const [x, y, name] = task.pos;
    const pos = new RoomPosition(x, y, name);
    const far = moveToTarget(creep, pos);
    if (far !== 0) {
        return ERR_NOT_IN_RANGE;
    }
    const target = Game.getObjectById(task.id) as any;
    if (task.trans_dec === 'in') {
        const type = task.resourceType;
        if (type === 'any') {
            RESOURCES_ALL.forEach(t => {
                if (creep.store[t] > 0) {
                    creep.transfer(target, t);
                }
            });
        } else {
            creep.transfer(target, type);
        }
    }

    if (task.trans_dec === 'out') {
        if (task.structureType === 'drop') {
            creep.pickup(target as Resource);
        } else {
            creep.withdraw(target, task.resourceType as any);
        }
    }
    checkTaskIsComplete(creep, task);
}

function checkTaskIsComplete(creep: Creep, task: TransTask) {
    if (task.trans_dec === 'in') {
        let type = task.resourceType === 'any' ? undefined : task.resourceType;
        // 卸载任务完成
        if (isEmpty(creep, type)) {
            delete cache_creep_task[creep.name];
            return true;
        }
        if (task.amount_rec >= task.amount) {
            delete cache_creep_task[creep.name];
            return true;
        }
    }

    if (task.trans_dec === 'out') {
        // 装运任务完成
        if (isFull(creep)) {
            delete cache_creep_task[creep.name];
            return true;
        }
        if (task.amount_rec >= task.amount) {
            delete cache_creep_task[creep.name];
            return true;
        }
    }
}

interface GenTask {
    amount: number;
    resourceType: resType;
    structureType?: strType;
}
function generateTask(structure: AnyStructure, { amount, resourceType, structureType }: GenTask) {
    const pos = [structure.pos.x, structure.pos.y, structure.pos.roomName];
    const st = structure?.structureType || structureType;
    return {
        id: structure.id,
        amount: amount,
        pos,
        amount_rec: 0,
        w: w_in[st],
        resourceType: resourceType,
        structureType: st,
    } as TransTask;
}
