import { moveToTarget } from './lib_creep';
import { run_creep } from './lib_base';
import { checkRemoteDanger } from './lib_room';

interface RemoteReserveTask {
    from: string;
    remote: string;
    creep_id: string;
    process: number;
    id: string;
    update_tick: number;
}

export class RemoteReserveW {
    private array: RemoteReserveTask[] = [];
    // reserve to this value
    private max_contain = 3500;
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
                    process: 0,
                    id: String(index + 1),
                    update_tick: 0,
                });
            });
        });
    }
    private update_tick2 = 0;
    public updateState = () => {
        if (this.update_tick2 === Game.time) {
            return;
        }
        this.update_tick2 = Game.time;
        run_creep(w_role_name.remote_reserve, creep => {
            if (creep.memory.remote_task_id) {
                let task = this.array.find(t => t.id === creep.memory.remote_task_id);
                if (!task) {
                    return this.forgetTask(creep);
                }
                task.creep_id = creep.id;
                task.update_tick = Game.time;
            }
        });
        Object.keys(w_config.rooms).forEach(name => {
            let cfg_room = w_config.rooms[name];
            let reserves = cfg_room.reserve || {};
            Object.keys(reserves).forEach((_name, index) => {
                let room = Game.rooms[_name];
                let target = this.array.find(s => s.remote === _name);
                if (room && target) {
                    target.process = room.controller?.reservation?.ticksToEnd;
                }
            });
        });
        this.array.forEach(task => {
            let room = Game.rooms[task.remote];
            if (room && room.controller?.reservation?.ticksToEnd) {
                task.process = room.controller?.reservation?.ticksToEnd || 0;
            } else {
                task.process = 0;
            }
            if (task.update_tick !== Game.time) {
                task.creep_id = '';
            }
        });
    };
    public getTask = (creep: Creep): RemoteReserveTask => {
        if (creep.memory.remote_task_id) {
            let prev = this.getTaskById(creep.memory.remote_task_id);
            if (prev) {
                return prev;
            }
        }
        this.updateState();
        let task = this.getTaskByOrder(creep);
        if (task) {
            task.creep_id = creep.id;
            creep.memory.remote_task_id = task.id;
        }
        return task;
    };
    private getTaskByOrder = (creep: Creep) => {
        const { from } = creep.memory;
        const met_array = this.array
            .filter(t => t.from === from)
            .sort((a, b) => {
                return a.process - b.process;
            });
        let min_no_creep = 5500;
        let min = 5500;
        let min_task_no_creep: RemoteReserveTask = {} as any;
        let min_task: RemoteReserveTask = {} as any;
        met_array.forEach(s => {
            let b = s.process < this.max_contain;
            let c = !s.creep_id;
            if (s.process < min) {
                // 其次选择值最小的
                min = s.process;
                min_task = s;
            }
            if (b && c) {
                // 优先没有creep的
                if (s.process < min_no_creep) {
                    min_no_creep = s.process;
                    min_task_no_creep = s;
                }
            }
        });
        if (min_task_no_creep) {
            return min_task_no_creep;
        }
        if (min_task) {
            return min_task;
        }
        return met_array.shift();
    };
    public forgetTask = (creep: Creep) => {
        let c_id = creep.memory.remote_task_id;
        creep.memory.remote_task_id = undefined;
        let task = this.getTaskById(c_id);
        if (task) {
            task.creep_id = '';
        }
    };
    public getRoomTask = (room: Room): RemoteReserveTask[] => {
        return this.array.filter(t => t.from === room.name);
    };
    public stop_spawn_reserve = (room: Room) => {
        this.updateState();
        const tasks = this.getRoomTask(room);
        return tasks.every(t => t.process > this.max_contain);
    };
    private getTaskById = (id: string): RemoteReserveTask => {
        return this.array.find(t => t.id === id);
    };
    private run_remote_reserve = (creep: Creep) => {
        if (checkRemoteDanger(creep)) {
            return;
        }
        const task = this.getTask(creep);
        if (creep.ticksToLive < 3) {
            // 临死遗言
            this.forgetTask(creep);
            // return;
        }
        if (!task) {
            creep.say('no task');
        }
        const target: Room = Game.rooms[task.remote];

        if (!target) {
            if (task && task.remote) {
                // 没有视野
                let pos = new RoomPosition(25, 25, task.remote);
                creep.moveTo(pos);
            } else {
                creep.say('no_target_' + target?.name);
            }
            return;
        }
        let far = moveToTarget(creep, target.controller as any);

        if (far < 10) {
            creep.reserveController(target.controller);
        }
    };

    private update_tick = 0;
    private tryUpdateState = () => {
        // 单位 1500 tick 一直采一个矿
        // 在接任务的时候热更新 不需要常更新
        if (Game.time - this.update_tick > 100) {
            this.update_tick = Game.time;
            this.updateState();
        }
    };
    private run = () => {
        this.tryUpdateState();
        run_creep(w_role_name.remote_reserve, this.run_remote_reserve);
    };
    private last_run_time = 0;
    public static cache_key = 'remote_ser_h';
    public static start = () => {
        let driver: RemoteReserveW = w_cache.get(RemoteReserveW.cache_key);
        if (!driver) {
            driver = new RemoteReserveW();
            w_cache.set(RemoteReserveW.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };
}

let driver: RemoteReserveW = w_cache.get(RemoteReserveW.cache_key);
if (!driver) {
    driver = new RemoteReserveW();
    w_cache.set(RemoteReserveW.cache_key, driver);
}
