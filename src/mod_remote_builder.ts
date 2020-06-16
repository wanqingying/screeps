import {
    getActionLockTarget,
    is_full_tate,
    isEmpty,
    run_creep,
    run_my_room,
} from './lib_base';
import { moveToTarget } from './lib_creep';
import { TransportDriver } from './mod_role_transport';

import { checkRemoteDanger } from './lib_room';

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

export class RemoteBuilder {
    private updateTick: number = undefined as any;
    private array: TaskBuild[] = [];

    public updateState = (force?: boolean) => {
        // 初始化以及每 50tick 更新一下数据 每次请求任务也需要更新数据
        if (this.updateTick === Game.time) {
            return;
        }
        if (this.updateTick && Game.time - this.updateTick < 50 && !force) {
            return;
        }
        this.updateTick = Game.time;
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

        this.updateState(true);

        let task = this.array.find(t => t.progress < t.progressTotal);
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
            const task = this.getTask(creep);
            if (!task) {
                this.forgetTask(creep);
                creep.say('no_task');
                return;
            }
            const target = Game.getObjectById(task.id);
            if (!target) {
                this.forgetTask(creep);
                creep.say('no_target');
                return;
            }
            const [x, y, name] = task.pos;
            const pos = new RoomPosition(x, y, name);
            const far = moveToTarget(creep, pos);
            let code;
            if (far < 7) {
                code = creep.build(target as any);
            }
        }
    };
    public run = () => {
        this.updateState();
        run_creep(w_role_name.remote_builder, creep => {
            try {
                this.run_remote_builder(creep);
            } catch (e) {
                console.log('err run_remote_builder');
                console.log(e.message);
                console.log(e.stack);
            }
        });
    };
    static start = function () {
        let che: RemoteBuilder = w_cache.get(w_code.REMOTE_KEY_BUILDER);
        if (!che) {
            che = new RemoteBuilder();
            w_cache.set(w_code.REMOTE_KEY_BUILDER, che);
        }
        che.run();
    };
}

RemoteBuilder.start();

class BaseDriver {
    constructor() {}

    public run: () => void;
    private key: string;
    static key: string;
    static start = Cls => {
        let che: BaseDriver = w_cache.get(Cls.key);
        if (!che) {
            che = new Cls();
        }
        che.run();
    };
}
