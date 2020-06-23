import { run_creep } from './lib_base';
import { moveToTarget } from './lib_creep';

export class BaseRoleUpgrader {
    private creep_get_lock: Map<string, PosDesc<Resource & StructureContainer>> = new Map();

    private getEnergyTarget = (creep: Creep) => {
        let p_task = this.creep_get_lock.get(creep.id);
        if (p_task) {
            return p_task;
        }
        let cto = G_BaseRoom.getController(creep.room);
        if (cto?.link && cto.link.target.store.energy > 100) {
            this.creep_get_lock.set(creep.id, cto.link as any);
            return cto.link;
        }
        if (cto?.container && cto.container.target.store.energy > 100) {
            this.creep_get_lock.set(creep.id, cto.container as any);
            return cto.container;
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

    run_upgrader = (creep: Creep) => {
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
            this.forgetEnergyTarget(creep);
        }
        if (free / cap <= 0.2) {
            //full
            creep.memory.process = p_work;
        }

        if (creep.memory.process === p_get) {
            this.run_creep_get(creep);
        }
        if (creep.memory.process === p_work) {
            const cto = creep.room.controller;
            // moveToTarget(creep, cto, 1.3);
            creep.say('up')
            const code = creep.upgradeController(cto);
            if (code === ERR_NOT_IN_RANGE) {
                creep.moveTo(cto);
            }
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
        creep.say('gt2' + far + creep.memory.process);
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
        run_creep(w_role_name.upgrader, creep => {
            try {
                this.run_upgrader(creep);
            } catch (e) {
                g_log('err run_upgrader ', creep.name);
                g_log_err(e.message);
                g_log_err(e.stack);
            }
        });
    };
    private last_run_time = 0;
    public static cache_key = 'R_P_G_pkms';
    public static start = () => {
        let driver: BaseRoleUpgrader = w_cache.get(BaseRoleUpgrader.cache_key);
        if (!driver) {
            driver = new BaseRoleUpgrader();
            w_cache.set(BaseRoleUpgrader.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };

    public static method = () => {
        const driver = BaseRoleUpgrader.start();
    };
}
export class BaseRoleUpg {
    private creep_get_lock: Map<string, PosDesc<Resource & StructureContainer>> = new Map();
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

    run_upgrader = (creep: Creep) => {
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
            this.forgetEnergyTarget(creep);
        }
        if (free / cap <= 0.2) {
            //full
            creep.memory.process = p_work;
        }

        if (creep.memory.process === p_get) {
            this.run_creep_get(creep);
        }
        if (creep.memory.process === p_work) {
            const cto = creep.room.controller;
            // moveToTarget(creep, cto, 1.3);
            const code = creep.upgradeController(cto);
            if (code === ERR_NOT_IN_RANGE) {
                creep.moveTo(cto);
            }
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
        creep.say('gt1' + far + creep.memory.process);
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
    private run = () => {
        run_creep(w_role_name.upg, creep => {
            try {
                this.run_upgrader(creep);
            } catch (e) {
                g_log('err run_upgrader ', creep.name);
                g_log_err(e.message);
                g_log_err(e.stack);
            }
        });
    };
    private last_run_time = 0;
    public static cache_key = 'R_P_G_o_s';
    public static start = () => {
        let driver: BaseRoleUpg = w_cache.get(BaseRoleUpg.cache_key);
        if (!driver) {
            driver = new BaseRoleUpg();
            w_cache.set(BaseRoleUpg.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };
}
