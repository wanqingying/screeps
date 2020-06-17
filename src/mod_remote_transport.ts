import { isEmpty, isFull, run_creep, run_my_room } from './lib_base';
import { checkRemoteDanger } from './lib_room';
import { TransportDriver } from './mod_role_transport';

const DROP = 'drop';

interface RemoteTransportTask {
    from: string;
    remote: string;
    id: string;
    resourceType: ResourceConstant;
    structureType: string;
    amount: number;
    amountRec: number;
    pos: any[];
    update_tick: number;
}
export class RemoteTransport {
    private array: RemoteTransportTask[] = [];
    public updateTask = (creep: Creep) => {
        let c_id = creep.memory.remote_task_id;
        let task = this.getTaskById(c_id);
        if (task) {
            task.amountRec = 0;
        }
    };
    public getRemember = (creep: Creep) => {
        if (creep.memory.remote_task_id) {
            let task = this.getTaskById(creep.memory.remote_task_id);
            if (task && task.amount > 100) {
                return task;
            } else {
                this.forgetTask(creep);
            }
        }
    };
    private getTask = (creep: Creep): RemoteTransportTask => {
        let prev = this.getRemember(creep);
        if (prev) {
            return prev;
        }
        // 不必每tick 都更新 只需要在有新需求的时候更新
        this.updateState();

        let task = this.getTaskByOrder(creep);
        if (task) {
            creep.memory.remote_task_id = task.id;
            task.amountRec += creep.store.getFreeCapacity();
        }
        return task;
    };

    private getTaskByOrder = (creep: Creep) => {
        const { from } = creep.memory;
        let max = -999;
        let max_task: RemoteTransportTask = undefined;
        let max_amount = 0;
        let max_amount_task: RemoteTransportTask = undefined;
        let same_room_task: RemoteTransportTask = undefined;
        // 优先找同一个房间的
        // 然后优先按照单位接收的数量智能选任务
        // 没找到就直接找数量最大的
        this.array.forEach(s => {
            let a = s.from === from;
            let b = s.amount > 100;
            if (s.amount > max_amount) {
                max_amount = s.amount;
                max_amount_task = s;
                if (s.remote === creep.room.name) {
                    same_room_task = s;
                }
            }
            if (a && b) {
                let k = s.amount - s.amountRec;
                if (k > max) {
                    max = k;
                    max_task = s;
                }
            }
        });

        return same_room_task || max_task || max_amount_task;
    };
    public forgetTask = (creep: Creep) => {
        let c_id = creep.memory.remote_task_id;
        creep.memory.remote_task_id = undefined;
        let task = this.getTaskById(c_id);
        if (task) {
            task.amountRec -= creep.store.getFreeCapacity();
        }
    };
    public getRoomTask = (room: Room): RemoteTransportTask[] => {
        return this.array.filter(t => t.from === room.name);
    };
    public stop_spawn_carry = (room: Room): boolean => {
        return this.array.filter(t => t.from === room.name && t.amount > 200).length === 0;
    };
    private getTaskById = (id: string): RemoteTransportTask => {
        return this.array.find(t => t.id === id);
    };
    private run_remote_transport = (creep: Creep) => {
        if (checkRemoteDanger(creep)) {
            creep.say('danger');
            return;
        }

        if (isFull(creep)) {
            creep.memory.process = DROP;
            this.forgetTask(creep);
        }

        if (isEmpty(creep)) {
            creep.memory.process = 'p';
        }

        if (creep.memory.process === DROP) {
            let task = this.getTask(creep);
            // drop
            creep.say('drop');

            let pos = new RoomPosition(25, 25, creep.memory.from);
            if (creep.memory.mv_tick > 0) {
                creep.memory.mv_tick--;
                creep.moveTo(pos);
            }

            if (creep.room.name !== creep.memory.from) {
                creep.moveTo(pos);
                creep.memory.mv_tick = 3;
            } else {
                let container_ids = w_config.rooms[task.from]?.remote_container || [];
                const cns: StructureContainer[] = container_ids
                    .map(id => Game.getObjectById(id))
                    .filter(c => c) as any;
                const target: StructureContainer = cns.find(c => {
                    return c.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                });

                if (target) {
                    const code = creep.transfer(target, task.resourceType);
                    if (code === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                } else {
                    return TransportDriver.giv_resource(creep);
                }
            }
        } else {
            // pick
            let task = this.getTask(creep);
            if (creep.ticksToLive < 3) {
                this.forgetTask(creep);
            }
            if (!task) {
                creep.say('no task');
                return;
            }
            let target = Game.getObjectById(task.id);

            if (!target) {
                creep.say('no_target_re_get');
                this.forgetTask(creep);
                target = Game.getObjectById(task.id);
                if (!target) {
                    creep.say('no_target');
                    return;
                }
            }
            creep.say('pi_k');
            let code;
            if (task.structureType === 'drop') {
                code = creep.pickup(target as any);
            } else {
                code = creep.withdraw(target as any, task.resourceType);
            }
            if (code === OK) {
                this.updateTask(creep);
            }
            if (code === ERR_NOT_IN_RANGE) {
                let [x, y, name] = task.pos;
                creep.moveTo(new RoomPosition(x, y, name));
            }
        }
    };
    public updateState = () => {
        if (this.update_tick === Game.time) {
            return;
        }
        this.update_tick = Game.time;
        run_my_room(room => {
            const remotes = w_config.rooms[room.name]?.reserve || {};
            Object.keys(remotes).forEach(remote_room_name => {
                const remote_room = Game.rooms[remote_room_name];
                if (!remote_room) {
                    return;
                }
                const drops = remote_room.find(FIND_DROPPED_RESOURCES, { filter: c => c.amount > 100 });
                drops.forEach(d => {
                    let exist = this.array.find(t => t.id === d.id);
                    if (exist) {
                        exist.amount = d.amount;
                        exist.update_tick = Game.time;
                    } else {
                        this.array.push({
                            from: room.name,
                            remote: remote_room_name,
                            id: d.id,
                            amount: d.amount,
                            amountRec: 0,
                            resourceType: d.resourceType,
                            structureType: 'drop',
                            pos: [d.pos.x, d.pos.y, d.pos.roomName],
                            update_tick: Game.time,
                        });
                    }
                });
                const container: StructureContainer[] = remote_room.find(FIND_STRUCTURES, {
                    filter: c => c.structureType === (STRUCTURE_CONTAINER as any),
                }) as any;
                container.forEach(d => {
                    let exist = this.array.find(t => t.id === d.id);
                    RESOURCES_ALL.forEach(resType => {
                        let amount = d.store[resType];
                        if (amount < 100) {
                            return;
                        }
                        if (exist) {
                            exist.amount = amount;
                            exist.update_tick = Game.time;
                        } else {
                            this.array.push({
                                from: room.name,
                                remote: remote_room_name,
                                id: d.id,
                                amount: amount,
                                amountRec: 0,
                                resourceType: RESOURCE_ENERGY,
                                structureType: STRUCTURE_CONTAINER,
                                pos: [d.pos.x, d.pos.y, d.pos.roomName],
                                update_tick: Game.time,
                            });
                        }
                    });
                });
            });
            // clear 清理消失的
            this.array = this.array.filter(t => t.update_tick === Game.time);
        });
    };
    private update_tick = 0;
    private tryUpdateState = () => {
        if (Game.time - this.update_tick > 40) {
            this.update_tick = Game.time;
            this.updateState();
        }
    };
    private run = () => {
        this.tryUpdateState();
        run_creep(w_role_name.remote_carry, this.run_remote_transport);
    };
    private last_run_time = 0;
    public static cache_key = 'remote_trans_t';
    public static start = () => {
        let driver: RemoteTransport = w_cache.get(RemoteTransport.cache_key);
        if (!driver) {
            driver = new RemoteTransport();
            w_cache.set(RemoteTransport.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };
}
