import { run_creep, run_my_room } from './lib_base';
import { moveToTarget } from './lib_creep';

export class BaseRoleHarvest {
    private array2: PosDescMine<Source | Mineral>[] = [];
    constructor() {
        run_my_room(room => {
            const arr = G_BaseRoom.findHarvestTargetsInRoom(room);
            this.array2 = this.array2.concat(arr);
        });
    }
    private updateState2 = () => {
        if (this.update_tick === Game.time) {
            return;
        }
        this.update_tick = Game.time;
        run_creep(w_role_name.harvester, creep => {
            const t_id = creep.memory.task_id;
            if (!t_id) {
                return;
            }
            const task = this.array2.find(t => t.id === creep.memory.task_id);
            if (task && task.update_tick === Game.time && task.creep_id) {
                task.creep_id = undefined;
                creep.memory.task_id = undefined;
            }
            if (task) {
                task.creep_id = creep.id;
                task.update_tick = Game.time;
            }
        });
        this.array2.forEach(t => {
            if (t.update_tick !== Game.time) {
                t.creep_id = '';
            }
        });
    };
    private trySpawnWorker = () => {
        this.updateState2();
        this.array2.forEach(t => {
            if (!t.creep_id) {
                const room = Game.rooms[t.roomName];
                G_SpawnAuto.spawnCreep(room, w_role_name.harvester, { task_id: t.id });
            }
        });
    };
    private run_harvest = (creep: Creep) => {
        let task2 = this.getTask2(creep);
        let free = creep.store.getFreeCapacity();

        if (!task2) {
            creep.say('no_task');
            return;
        }
        if (free < 16) {
            if (task2.link) {
                let code = creep.transfer(task2.link.target, RESOURCE_ENERGY);
                if (code === ERR_NOT_IN_RANGE) {
                    creep.moveTo(task2.link.target);
                    return;
                }
            } else {
                RESOURCES_ALL.forEach(r => creep.drop(r));
                // creep.drop(task2.resType);
            }
        }
        moveToTarget(creep, task2.container?.target || task2.target);
        let code = creep.harvest(task2.target);
        if (code === ERR_NOT_IN_RANGE) {
            creep.moveTo(task2.container?.target || task2.target);
        }
    };
    private getTask2 = (creep: Creep) => {
        let task = this.array2.find(t => t.id === creep.memory.task_id);
        if (task) {
            return task;
        }
        const newTask = this.array2.find(t => !t.creep_id && t.roomName === creep.room.name);
        if (newTask) {
            newTask.creep_id = creep.id;
            creep.memory.task_id = newTask.id;
        }
        return newTask;
    };
    private update_tick = 0;
    private run = () => {
        this.updateState2();
        run_creep(w_role_name.harvester, creep => {
            try {
                this.run_harvest(creep);
            } catch (e) {
                g_log('err run_harvest ', creep.name);
                g_log_err(e.message);
                g_log_err(e.stack);
            }
        });
        this.trySpawnWorker();
    };
    private last_run_time = 0;
    public static cache_key = 'h_a_m_t';
    public static start = () => {
        let driver: BaseRoleHarvest = w_cache.get(BaseRoleHarvest.cache_key);
        if (!driver) {
            driver = new BaseRoleHarvest();
            w_cache.set(BaseRoleHarvest.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };
}
