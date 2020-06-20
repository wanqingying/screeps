import { run_creep } from './lib_base';
import { moveToTarget } from './lib_creep';

export class BaseRoleRepair {
    private creep_get_lock: Map<string, PosDesc<Resource & StructureContainer>> = new Map();
    private creep_task_lock: Map<string, PosDesc<AnyStructure>> = new Map();

    private getWorkTask = (creep: Creep) => {
        let p_task = this.creep_task_lock.get(creep.id);
        if (p_task) {
            return p_task;
        }
        let task = G_BaseRoom.getRepairTarget(creep);
        if (task) {
            this.creep_task_lock.set(creep.id, task);
            return task;
        }
        let task2 = G_BaseRoom.getRepairWarTarget(creep);
        if (task2) {
            this.creep_task_lock.set(creep.id, task2);
            return task2;
        }
    };
    private forgetWorkTask = (creep: Creep) => {
        this.creep_task_lock.delete(creep.id);
    };
    private getEnergyTarget = (creep: Creep) => {
        let p_task = this.creep_get_lock.get(creep.id);
        if (p_task) {
            return p_task;
        }
        let task = G_BaseRoom.findTargetToGetEnergy(creep);
        if (task) {
            this.creep_get_lock.set(creep.id, task);
            return task;
        }
    };
    private forgetEnergyTarget = (creep: Creep) => {
        this.creep_get_lock.delete(creep.id);
    };

    run_repair = (creep: Creep) => {
        creep.say('mv');
        const free = creep.store.getFreeCapacity();
        const cap = creep.store.getCapacity();
        const p_get = 'get';
        const p_work = 'work';

        if (![p_work, p_get].includes(creep.memory.process)) {
            creep.memory.process = p_get;
        }

        if (free / cap >= 1) {
            //empty
            creep.memory.process = p_get;
            this.forgetWorkTask(creep);
        }
        if (free / cap <= 0.2) {
            //full
            creep.memory.process = p_work;
            this.forgetEnergyTarget(creep);
        }

        if (creep.memory.process === p_get) {
            this.run_creep_get(creep);
        }
        if (creep.memory.process === p_work) {
            this.run_creep_repair(creep);
        }
    };
    private run_creep_get = (creep: Creep) => {
        let task_get = this.getEnergyTarget(creep);
        creep.say('get');
        if (!task_get) {
            return creep.say('gt_no');
        }
        const [x, y, name] = task_get.pos;
        const pos = new RoomPosition(x, y, name);
        const far = moveToTarget(creep, pos, 1.5);
        creep.say('gt' + far + creep.memory.process);
        if (far < 3) {
            let code;
            if (task_get.target?.store) {
                code = creep.withdraw(task_get.target, RESOURCE_ENERGY);
            } else {
                let k: Resource = task_get.target;
                code = creep.pickup(k);
            }
        }
        if (far < 2) {
            this.forgetEnergyTarget(creep);
        }
    };
    private run_creep_repair = (creep: Creep) => {
        let task = this.getWorkTask(creep);
        if (!task) {
            return creep.say('dp_no');
        }

        const [x, y, name] = task.pos;
        const pos = new RoomPosition(x, y, name);
        const far = moveToTarget(creep, pos, 1.3);
        creep.say('bd' + far);
        if (far <= 3) {
            let code = creep.repair(task.target);
            if (code === OK) {
                creep.say('ok');
            } else {
                this.forgetWorkTask(creep);
            }
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
        run_creep(w_role_name.repair, creep => {
            try {
                this.run_repair(creep);
            } catch (e) {
                g_log('err run_repair ', creep.name);
                g_log_err(e.message);
                g_log_err(e.stack);
            }
        });
    };
    private last_run_time = 0;
    public static cache_key = 'b_s_t_rp_k';
    public static start = () => {
        let driver: BaseRoleRepair = w_cache.get(BaseRoleRepair.cache_key);
        if (!driver) {
            driver = new BaseRoleRepair();
            w_cache.set(BaseRoleRepair.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };

    public static run_as_repair = (creep: Creep) => {
        const driver = BaseRoleRepair.start();
        driver.run_repair(creep);
    };

    public static method = () => {
        const driver = BaseRoleRepair.start();
    };
}

global.G_BaseRoleRepair = BaseRoleRepair;
