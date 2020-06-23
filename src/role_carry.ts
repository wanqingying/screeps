import { run_creep } from './lib_base';
import { moveToTarget } from './lib_creep';

export class BaseRoleCarry {
    private creep_get_lock: Map<string, PosDesc<Resource & StructureContainer>> = new Map();
    private creep_drop_lock: Map<string, PosDesc<TypeEnergyStructure>> = new Map();

    private getTask = (creep: Creep) => {
        let p_task = this.creep_get_lock.get(creep.id);
        if (p_task) {
            return p_task;
        }
        let task = G_BaseRoom.findTargetToPickUpOrWithdraw(creep);
        if (task) {
            this.creep_get_lock.set(creep.id, task);
            return task;
        }
        creep.say('no_t');
    };
    private forgetTask = (creep: Creep) => {
        this.creep_get_lock.delete(creep.id);
    };
    private getDropTask = (creep: Creep) => {
        let p_task = this.creep_drop_lock.get(creep.id);
        if (p_task) {
            return p_task;
        }
        let task = G_BaseRoom.findTargetToTransfer(creep);
        if (task) {
            this.creep_drop_lock.set(creep.id, task);
            return task;
        }
    };
    private forgetDropTask = (creep: Creep) => {
        this.creep_drop_lock.delete(creep.id);
    };

    run_carry = (creep: Creep) => {
        creep.say('mv');
        const free = creep.store.getFreeCapacity();
        const cap = creep.store.getCapacity();
        const p_get = 'get';
        const p_droop = 'drop';

        if (![p_droop, p_get].includes(creep.memory.process)) {
            creep.memory.process = p_get;
        }

        if (free / cap > 0.8) {
            creep.memory.process = p_get;
            this.forgetDropTask(creep);
        }
        if (free / cap < 0.2) {
            creep.memory.process = p_droop;
            this.forgetTask(creep);
        }

        if (creep.memory.process === p_get) {
            this.run_creep_get(creep);
        }
        if (creep.memory.process === p_droop) {
            this.run_creep_drop(creep);
        }
    };
    private run_creep_get = (creep: Creep) => {
        let task_get = this.getTask(creep);
        creep.say('get');
        if (!task_get) {
            return creep.say('gt_no');
        }
        const [x, y, name] = task_get.pos;
        const pos = new RoomPosition(x, y, name);
        const far = moveToTarget(creep, pos, 1.5);
        creep.say('gt' + far);
        if (far < 3) {
            let code;
            if (task_get.target?.store) {
                RESOURCES_ALL.forEach(resT => {
                    const am = task_get.target.store[resT];
                    if (am > 0) {
                        code = creep.withdraw(task_get.target, resT);
                    }
                });
            } else {
                let k: Resource = task_get.target;
                code = creep.pickup(k);
            }
            if (far < 2) {
                this.forgetTask(creep);
            }
        }
    };
    private run_creep_drop = (creep: Creep) => {
        let task = this.getDropTask(creep);
        if (!task) {
            return creep.say('dp_no');
        }

        const [x, y, name] = task.pos;
        const pos = new RoomPosition(x, y, name);
        const far = moveToTarget(creep, pos, 1.5);
        creep.say('dp3' + far + creep.memory.process);
        if (far <= 5) {
            let code;
            RESOURCES_ALL.forEach(resType => {
                const am = creep.store[resType];
                if (am > 0) {
                    code = creep.transfer(task.target, resType);
                }
            });
            if (code === OK) {
                creep.say('ok');
            }
        }
        if (far < 2) {
            this.forgetDropTask(creep);
        }
    };

    private updateState = () => {
        if (this.update_tick === Game.time) {
            return;
        }
        this.update_tick = Game.time;
    };
    private update_tick = 0;
    private tryUpdateState = () => {
        if (Game.time - this.update_tick > 27) {
            this.update_tick = Game.time;
            this.updateState();
        }
    };
    private run = () => {
        this.tryUpdateState();
        run_creep(w_role_name.carrier, creep => {
            try {
                this.run_carry(creep);
            } catch (e) {
                g_log('err run_carry ', creep.name);
                g_log_err(e.message);
                g_log_err(e.stack);
            }
        });
    };
    private last_run_time = 0;
    public static cache_key = 'b_t_s_test';
    public static start = () => {
        let driver: BaseRoleCarry = w_cache.get(BaseRoleCarry.cache_key);
        if (!driver) {
            driver = new BaseRoleCarry();
            w_cache.set(BaseRoleCarry.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };

    public static method = () => {
        const driver = BaseRoleCarry.start();
    };
}
