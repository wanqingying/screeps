import { moveToTarget } from './lib_creep';
import { run_creep } from './lib_base';
import { checkRemoteDanger } from './lib_room';

interface RemoteMineSite {
    source_id: string;
    container_id: string;
    container_pos: any[];
    from: string;
    remote: string;
    creep_id: string;
    update_tick: number;
}
export class RemoteHarvest {
    private array: RemoteMineSite[];
    constructor() {
        this.array = [];
        Object.keys(w_config.rooms).forEach(from_room_name => {
            let cfg_room = w_config.rooms[from_room_name];
            let reserves = cfg_room.reserve || {};

            Object.keys(reserves).forEach(remote_room_name => {
                let s = reserves[remote_room_name];
                s.forEach(u => {
                    this.array.push({
                        source_id: u.id,
                        container_id: u.container_id,
                        container_pos: u.container_pos,
                        from: from_room_name,
                        remote: remote_room_name,
                        creep_id: '',
                        update_tick: 0,
                    });
                });
            });
        });
    }
    public updateState = () => {
        if (this.update_tick === Game.time) {
            return;
        }
        this.update_tick = Game.time;
        run_creep(w_role_name.remote_harvester, creep => {
            if (creep.memory.remote_task_id) {
                let task = this.getTaskById(creep.memory.remote_task_id);
                if (task && creep.ticksToLive > 150) {
                    if (task.update_tick === Game.time && task.creep_id !== creep.id) {
                        //两个单位占用一个矿
                        creep.memory.remote_task_id = undefined;
                    } else {
                        task.creep_id = creep.id;
                        task.update_tick = Game.time;
                    }
                }
            }
        });
        this.array.forEach(g => {
            if (g.update_tick !== Game.time) {
                g.update_tick = Game.time;
                g.creep_id = '';
            }
        });
    };
    public getTask = (creep: Creep): RemoteMineSite | undefined => {
        let e_id = creep.memory.remote_task_id;
        if (e_id) {
            let prev = this.getTaskById(e_id);
            if (prev) {
                return prev;
            }
        }
        this.updateState();
        const task = this.getTaskByOrder(creep);
        if (task) {
            task.creep_id = creep.id;
            creep.memory.remote_task_id = task.source_id;
        }
        return task;
    };
    // 选任务策略 优先本房间的
    private getTaskByOrder = (creep: Creep) => {
        let same_room_task = this.getSameRoomTask(creep);
        if (same_room_task) {
            // console.log('same');
            return same_room_task;
        }
        return this.array.find(t => {
            if (t.from !== creep.memory.from) {
                return false;
            }
            if (t.creep_id) {
                // 接班 死掉的 或者将要死掉的
                let cp: Creep = Game.getObjectById(t.creep_id);
                if (!cp) {
                    return true;
                }
                return cp.ticksToLive < 100;
            } else {
                // 一个矿安排一个
                return true;
            }
        });
    };
    public getSameRoomTask = (creep: Creep) => {
        return this.array.find(t => {
            if (t.from !== creep.memory.from) {
                return false;
            }
            // 只考虑相同房间的
            if (t.remote !== creep.room.name) {
                return false;
            }
            if (t.creep_id) {
                // 接班 死掉的 或者将要死掉的
                let cp: Creep = Game.getObjectById(t.creep_id);
                if (!cp) {
                    return true;
                }
                return cp.ticksToLive < 200;
            } else {
                // 一个矿安排一个
                return true;
            }
        });
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
    private getTaskById = (id: string) => {
        return this.array.find(t => t.source_id === id);
    };
    private run_remote_harvest = (creep: Creep) => {
        if (checkRemoteDanger(creep)) {
            creep.say('danger');
            return;
        }
        const task = this.getTask(creep);
        if (creep.ticksToLive < 3) {
            // 临死遗言
            this.forgetTask(creep);
            creep.say('die');
            return;
        }
        if (!task) {
            creep.say('no_task');
            return;
        }
        const target: Source = Game.getObjectById(task.source_id);
        let container: StructureContainer;
        if (!target) {
            if (task.remote !== creep.room.name) {
                // 没有视野
                let pos = new RoomPosition(25, 25, task.remote);
                creep.say('go_see');
                return creep.moveTo(pos);
            }
            creep.say('no');
            return;
        }
        let pos = target.pos;
        if (Array.isArray(task.container_pos)) {
            const [x, y] = task.container_pos;
            if (x && y) {
                pos = new RoomPosition(x, y, task.remote);
            }
        } else if (task.container_id) {
            container = Game.getObjectById(task.container_id);
            if (container) {
                pos = container.pos;
            }
        }
        creep.say('do');
        let far = moveToTarget(creep, pos);
        if (far < 4) {
            creep.harvest(target);
        }
    };

    private update_tick = 0;
    private tryUpdateState = () => {
        // 单位 1500 tick 一直采一个矿
        // 在接任务的时候热更新 不需要常更新
        if (Game.time - this.update_tick > 200) {
            this.update_tick = Game.time;
            this.updateState();
        }
    };
    private run = () => {
        this.tryUpdateState();
        run_creep(w_role_name.remote_harvester, this.run_remote_harvest);
    };
    private last_run_time = 0;
    public static cache_key = 'remote_harvest_h';
    public static start = () => {
        let driver: RemoteHarvest = w_cache.get(RemoteHarvest.cache_key);
        if (!driver) {
            driver = new RemoteHarvest();
            w_cache.set(RemoteHarvest.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };
}
let driver: RemoteHarvest = w_cache.get(RemoteHarvest.cache_key);
if (!driver) {
    driver = new RemoteHarvest();
    w_cache.set(RemoteHarvest.cache_key, driver);
}
