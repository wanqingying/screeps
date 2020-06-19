import { moveToTarget } from './lib_creep';
import { findAttackTarget, run_creep, run_my_room } from './lib_base';
import { SpawnAuto } from './mod_spawn_creep';

interface RemoteAttackTask {
    from: string;
    remote: string;
    id: string;
    creep_id: string;
    target: Creep;
    update_tick: number;
    has_atk: boolean;
}
export class RemoteAttackW {
    private array: RemoteAttackTask[];
    constructor() {
        this.array = [];
        Object.keys(w_config.rooms).forEach(name => {
            let cfg_room = w_config.rooms[name];
            let reserves = cfg_room.reserve || {};
            Object.keys(reserves).forEach((_name, index) => {
                this.array.push({
                    remote: _name,
                    from: name,
                    creep_id: '',
                    id: String(index + 1),
                    target: null,
                    update_tick: 0,
                    has_atk: false,
                });
            });
        });
    }
    public getTask = (creep: Creep): RemoteAttackTask | undefined => {
        let e_id = creep.memory.remote_task_id;
        if (e_id) {
            let prev = this.getTaskById(e_id);
            if (prev && prev.target) {
                return prev;
            }
        }
        const from = creep.memory.from;
        const task = this.array.find(t => {
            if (t.from !== from) {
                return false;
            }
            return t.target;
        });
        if (task) {
            task.creep_id = creep.id;
            creep.memory.remote_task_id = task.id;
        }
        return task;
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
    public shouldSpawnAttack = (room: Room) => {
        this.updateState();
        return this.array.find(t => t.target && t.from === room.name);
    };
    private getTaskById = (id: string) => {
        return this.array.find(t => t.id === id);
    };
    private run_remote_attack = (creep: Creep) => {
        let task = this.getTask(creep);
        if (task && task.target) {
            let code = creep.attack(task.target);
            if (code === ERR_NOT_IN_RANGE) {
                creep.moveTo(task.target);
            }
        } else {
            creep.memory.process += 1;
            g_log(creep.name, ' no atk target');
            if (creep.memory.process > 4) {
                let room = Game.rooms[creep.memory.from];
                const sp: StructureSpawn = room.find(FIND_MY_SPAWNS).pop();
                let far = moveToTarget(creep, sp as any);
                if (far < 3) {
                    sp.recycleCreep(creep);
                }
            }
        }
    };
    private spawn_attack = (room: Room) => {
        let spawn = this.shouldSpawnAttack(room);
        let has_atk = this.array.find(t => t.from === room.name && t.has_atk);
        if (has_atk) {
            return;
        }
        if (spawn && spawn.target && spawn.target?.ticksToLive > 300) {
            SpawnAuto.spawnCreep(room, w_role_name.remote_attack, { remote: spawn.remote });
        }
    };

    private updateState = () => {
        if (this.update_tick === Game.time) {
            return;
        }
        this.update_tick = Game.time;
        let atk = Object.values(Game.creeps).filter(
            c => c.memory.role === w_role_name.remote_attack
        );
        this.array.forEach(task => {
            task.has_atk = !!atk.find(c => c.memory.from === task.from);
            if (task.update_tick === Game.time) {
                return;
            }
            let room = Game.rooms[task.remote];
            if (room) {
                let target = findAttackTarget(room);
                if (target) {
                    task.target = target;
                } else {
                    task.target = undefined;
                }
            }
        });
    };
    private update_tick = 0;
    private tryUpdateState = () => {
        // if (Game.time - this.update_tick > 27) {
        //     this.update_tick = Game.time;
        //     this.updateState();
        // }
        this.updateState();
    };
    public warning = (creep: Creep, target: any) => {
        let g = this.array.find(t => t.from === creep.memory.from);
        g.target = target;
        g.update_tick = Game.time;
    };
    private run = () => {
        this.tryUpdateState();
        run_creep(w_role_name.remote_attack, this.run_remote_attack);
        run_my_room(this.spawn_attack);
    };
    private last_run_time = 0;
    public static cache_key = 'remote_attack_g_v';
    public static start = () => {
        let driver: RemoteAttackW = w_cache.get(RemoteAttackW.cache_key);
        if (!driver) {
            driver = new RemoteAttackW();
            w_cache.set(RemoteAttackW.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };
}
let driver: RemoteAttackW = w_cache.get(RemoteAttackW.cache_key);
if (!driver) {
    driver = new RemoteAttackW();
    w_cache.set(RemoteAttackW.cache_key, driver);
}
