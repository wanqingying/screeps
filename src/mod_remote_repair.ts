import {
    findNearDropOrContainerTarget,
    findNearTarget,
    getActionLockTarget,
    is_more_than,
    isEmpty,
    run_creep,
    run_my_room,
} from './lib_base';
import { TransportDriver } from './mod_role_transport';
import { moveToTarget } from './lib_creep';
import { checkRemoteDanger } from './lib_room';

interface TaskRepair {
    pos: any[];
    id: string;
    hits: number;
    hitsMax: number;
    creep_id: string;
    updateTick: number;
    from: string;
    remote: string;
}
export class RemoteRepair {
    private born_tick = Game.time;
    private last_run_time = 0;
    public static cache_key = w_code.DRIVER_KEY_REMOTE_REPAIR;
    private updateTick: number = undefined as any;
    private repairArray: TaskRepair[] = [];

    public updateState = (force?: boolean) => {
        // 初始化以及每 50tick 更新一下数据 每次请求任务也需要更新数据
        if (this.updateTick === Game.time) {
            return;
        }
        if (this.updateTick && Game.time - this.updateTick < 50 && !force) {
            return;
        }
        this.updateTick = Game.time;
        const repair_list: { site: AnyStructure; from: string }[] = [];
        run_my_room(room => {
            const remotes = w_config.rooms[room.name]?.reserve || {};
            Object.keys(remotes).forEach(name => {
                const remote_room = Game.rooms[name];
                if (remote_room) {
                    remote_room.find(FIND_STRUCTURES).forEach(s => {
                        let los = s.hitsMax - s.hits;
                        let los_rate = los / s.hitsMax;
                        if (los > 2000 || los_rate > 0.2) {
                            repair_list.push({ site: s, from: room.name });
                        }
                    });
                }
            });
        });
        // update site
        repair_list.forEach(({ site, from }) => {
            let exist = this.repairArray.find(t => t.id === site.id);
            if (exist) {
                exist.hits = site.hits;
                exist.updateTick = Game.time;
            } else {
                this.repairArray.push({
                    pos: [site.pos.x, site.pos.y, site.pos.roomName],
                    id: site.id,
                    hits: site.hits,
                    hitsMax: site.hitsMax,
                    creep_id: '',
                    updateTick: Game.time,
                    from: from,
                    remote: site.room.name,
                });
            }
        });
        // remove not exist site
        this.repairArray = this.repairArray.filter(t => t.updateTick === Game.time);
    };
    public getRepairTask = (creep: Creep) => {
        let prev = this.getRememberRepairTask(creep);
        if (prev) {
            if (prev.hits < prev.hitsMax) {
                return prev;
            } else {
                this.forgetRepairTask(creep);
            }
        }

        this.updateState(true);

        let task = this.getTaskByOrder(creep);
        if (task) {
            creep.memory.remote_task_id = task.id;
        }
        return task;
    };

    private getTaskByOrder = (creep: Creep): TaskRepair => {
        let targets = this.repairArray
            .filter(s => s.from === creep.memory.from)
            .filter(s => s.hits < s.hitsMax);
        let same_room = targets.filter(s => s.remote === creep.room.name);
        if (same_room.length > 0) {
            return findNearTarget(creep, same_room);
        }
        return targets.pop();
    };
    public getRepairTaskById = (id: string) => {
        return this.repairArray.find(t => t.id === id);
    };
    public getRememberRepairTask = (creep: Creep) => {
        if (creep.memory.remote_task_id) {
            return this.getRepairTaskById(creep.memory.remote_task_id);
        }
    };
    public forgetRepairTask = (creep: Creep) => {
        if (creep.memory.remote_task_id) {
            let prev = this.getRepairTaskById(creep.memory.remote_task_id);
            if (prev) {
                // prev.creep_id=undefined
            }
        }
        creep.memory.remote_task_id = undefined;
    };
    private run_repair = (creep: Creep) => {
        const task = this.getRepairTask(creep);
        if (!task) {
            this.forgetRepairTask(creep);
            creep.say('no_target');
            return;
        }
        creep.say('repair');
        const target = Game.getObjectById(task.id);
        if (!target) {
            this.forgetRepairTask(creep);
            creep.say('no_target');
            return;
        }
        const [x, y, name] = task.pos;
        const pos = new RoomPosition(x, y, name);
        const far = moveToTarget(creep, pos, 2);
        let code;
        if (far < 5) {
            code = creep.repair(target as any);
            if (code === ERR_NOT_IN_RANGE) {
                creep.moveTo(target as any);
            }
        }
    };
    private run_remote_repair = (creep: Creep) => {
        if (checkRemoteDanger(creep)) {
            return;
        }
        const used = creep.store.getUsedCapacity(RESOURCE_ENERGY);
        const cap = creep.store.getCapacity(RESOURCE_ENERGY);
        if (used < 25) {
            creep.memory.process = 'get';
        }
        if (used / cap > 0.8) {
            creep.memory.process = 'bud';
        }
        if (creep.memory.process === 'get') {
            if (creep.memory.from === creep.room.name) {
                return TransportDriver.get_resource(creep);
            }
            const { target, unLock } = getActionLockTarget(creep, 'run_remote_builder', () =>
                findNearDropOrContainerTarget(creep)
            );
            if (target) {
                let far = moveToTarget(creep, target);
                if (far > 4) {
                    return;
                }
                let code;
                if (target.store) {
                    code = creep.withdraw(target, RESOURCE_ENERGY);
                    if (target.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                        unLock();
                    }
                }
                if (target.amount) {
                    code = creep.pickup(target);
                    if (target.amount === 0) {
                        unLock();
                    }
                }
                if (code === OK) {
                    unLock();
                }
            } else {
                unLock();
                creep.moveTo(new RoomPosition(25, 25, creep.memory.from));
            }
        }
        if (creep.memory.process === 'bud') {
            this.run_repair(creep);
        }
    };
    private last_update_time = 0;
    private tryUpdateState = () => {
        if (Game.time - this.last_update_time > 8) {
            this.last_update_time = Game.time;
            this.updateState();
        }
    };
    private run = () => {
        this.tryUpdateState();
        run_creep(w_role_name.remote_repair, creep => {
            try {
                this.run_remote_repair(creep);
            } catch (e) {
                g_log('err run_remote_repair');
                g_log_err(e.message);
                g_log_err(e.stack);
            }
        });
    };
    public static start = () => {
        let driver: RemoteRepair = w_cache.get(RemoteRepair.cache_key);
        if (!driver) {
            driver = new RemoteRepair();
            w_cache.set(RemoteRepair.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };

    public static run_ad_remote_repair = (creep: Creep) => {
        const driver = RemoteRepair.start();
        driver.run_remote_repair(creep);
    };
}

interface TaskBuild {
    pos: any[];
    id: string;
    progress: number;
    progressTotal: number;
    creep_id: string;
    updateTick: number;
    from: string;
    remote: string;
}
interface TaskRepair {
    pos: any[];
    id: string;
    hits: number;
    hitsMax: number;
    creep_id: string;
    updateTick: number;
    from: string;
    remote: string;
}

export class RemoteBuilder {
    private array: TaskBuild[] = [];
    public updateState = () => {
        const site_list: { site: ConstructionSite; from: string }[] = [];
        run_my_room(room => {
            const remotes = w_config.rooms[room.name]?.reserve || {};
            Object.keys(remotes).forEach(name => {
                const remote_room = Game.rooms[name];
                if (remote_room) {
                    remote_room.find(FIND_MY_CONSTRUCTION_SITES).forEach(site => {
                        site_list.push({ site, from: room.name });
                    });
                }
            });
        });
        // update site
        site_list.forEach(({ site, from }) => {
            let exist = this.array.find(t => t.id === site.id);
            if (exist) {
                exist.progress = site.progress;
                exist.updateTick = Game.time;
            } else {
                this.array.push({
                    pos: [site.pos.x, site.pos.y, site.pos.roomName],
                    id: site.id,
                    progress: site.progress,
                    progressTotal: site.progressTotal,
                    creep_id: '',
                    updateTick: Game.time,
                    from: from,
                    remote: site.room.name,
                });
            }
        });
        // remove not exist site
        this.array = this.array.filter(t => t.updateTick === Game.time);
    };
    public getTask = (creep: Creep) => {
        let prev = this.getRememberTask(creep);
        if (prev) {
            if (prev.progress < prev.progressTotal) {
                return prev;
            } else {
                this.forgetTask(creep);
            }
        }

        let tasks = this.array.filter(t => t.progress < t.progressTotal);
        let task = findNearTarget(creep, tasks);
        if (task) {
            creep.memory.remote_task_id = task.id;
        }
        return task;
    };
    public getTaskById = (id: string) => {
        return this.array.find(t => t.id === id);
    };
    public getRememberTask = (creep: Creep) => {
        if (creep.memory.remote_task_id) {
            return this.getTaskById(creep.memory.remote_task_id);
        }
    };
    public forgetTask = (creep: Creep) => {
        if (creep.memory.remote_task_id) {
            let prev = this.getTaskById(creep.memory.remote_task_id);
            if (prev) {
                // prev.creep_id=undefined
            }
        }
        creep.memory.remote_task_id = undefined;
    };
    private run_remote_builder = (creep: Creep) => {
        if (checkRemoteDanger(creep)) {
            return;
        }
        if (isEmpty(creep)) {
            creep.memory.process = 'get';
        }
        if (is_more_than(creep, 0.7)) {
            creep.memory.process = 'bud';
        }
        if (creep.memory.process === 'get') {
            creep.say('get');
            if (creep.memory.from === creep.room.name) {
                return TransportDriver.get_resource(creep);
            }
            const { target, unLock } = getActionLockTarget(creep, 'run_remote_builder', () =>
                findNearDropOrContainerTarget(creep)
            );
            if (target) {
                creep.say('get_b');
                let far = moveToTarget(creep, target, 2);
                if (far > 3) {
                    return;
                }
                let code;
                if (target.store) {
                    code = creep.withdraw(target, RESOURCE_ENERGY);
                    if (target.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                        unLock();
                    }
                }
                if (target.amount) {
                    code = creep.pickup(target);
                    if (target.amount === 0) {
                        unLock();
                    }
                }
                if (code === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
                if (code === OK) {
                    unLock();
                }
            } else {
                creep.say('get_home');
                unLock();
                creep.moveTo(new RoomPosition(25, 25, creep.memory.from));
            }
        }

        if (creep.memory.process === 'bud') {
            const task = this.getTask(creep);
            if (!task) {
                this.forgetTask(creep);
                creep.say('no_task');
                return RemoteRepair.run_ad_remote_repair(creep);
            }
            const target = Game.getObjectById(task.id);
            if (!target) {
                this.forgetTask(creep);
                creep.say('no_target');
                return RemoteRepair.run_ad_remote_repair(creep);
            }
            const [x, y, name] = task.pos;
            const pos = new RoomPosition(x, y, name);
            let code = creep.build(target as any);
            creep.say('bud');
            if (code === ERR_NOT_IN_RANGE) {
                const far = moveToTarget(creep, pos, 1);
            }
        }
    };
    private last_update_time = 0;
    private tryUpdateState = () => {
        if (Game.time - this.last_update_time > 8) {
            this.last_update_time = Game.time;
            this.updateState();
        }
    };
    public run = () => {
        this.tryUpdateState();
        run_creep(w_role_name.remote_builder, creep => {
            try {
                this.run_remote_builder(creep);
            } catch (e) {
                g_log('err run_remote_builder');
                g_log_err(e.message);
                g_log_err(e.stack);
            }
        });
    };
    private last_run_time = 0;
    static start = function () {
        let driver: RemoteBuilder = w_cache.get(w_code.REMOTE_KEY_BUILDER);
        if (!driver) {
            driver = new RemoteBuilder();
            w_cache.set(w_code.REMOTE_KEY_BUILDER, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };
}
