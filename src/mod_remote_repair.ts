import { getActionLockTarget, is_full_tate, isEmpty, run_creep, run_my_room } from './lib_base';
import { TransportDriver } from './mod_role_transport';
import { moveToTarget } from './lib_creep';

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
                        if (los > 3000 || los_rate > 0.3) {
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

        let task = this.repairArray.find(t => t.hits < t.hitsMax);
        if (task) {
            creep.memory.remote_task_id = task.id;
        }
        return task;
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
        const far = moveToTarget(creep, pos, 1);
        let code;
        if (far < 5) {
            code = creep.repair(target as any);
        }
    };
    private run_remote_repair = (creep: Creep) => {
        if (isEmpty(creep)) {
            creep.memory.process = 'get';
        }
        if (is_full_tate(creep, 0.7)) {
            creep.memory.process = 'bud';
        }
        function getTarget() {
            let drop: Resource;
            let max = 0;
            creep.room.find(FIND_DROPPED_RESOURCES).forEach(t => {
                if (t.amount > max) {
                    max = t.amount;
                    drop = t;
                }
            });
            if (drop) {
                return drop;
            }
            let max2 = 0;
            let container: StructureContainer;
            creep.room
                .find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType === (STRUCTURE_CONTAINER as any),
                })
                .forEach(s => {
                    let t: StructureContainer = s as any;
                    if (t.store) {
                        let c = t.store.getUsedCapacity(RESOURCE_ENERGY);
                        if (c > max2) {
                            max2 = c;
                            container = t;
                        }
                    }
                });
            if (container) {
                return container;
            }
        }

        if (creep.memory.process === 'get') {
            if (creep.memory.from === creep.room.name) {
                return TransportDriver.get_resource(creep);
            }
            const { target, unLock } = getActionLockTarget(creep, 'run_remote_builder', getTarget);
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
    private run = () => {
        this.updateState();
        run_creep(w_role_name.remote_repair, creep => {
            try {
                this.run_remote_repair(creep);
            } catch (e) {
                console.log('err run_remote_repair');
                console.log(e.message);
                console.log(e.stack);
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
