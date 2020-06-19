import { moveToTarget } from './lib_creep';
import { findNearTarget, is_more_than, run_creep, run_my_room } from './lib_base';
import { BaseRoom } from './base_room';

interface TaskH {
    room_name: string;
    source_id: string;
    resType: string;
    creep_id: string;
    update_tick: number;
    pos: any[];
}

export class HarvestAtMyRoom {
    private array: TaskH[] = [];
    constructor() {
        run_my_room(room => {
            let cts: StructureContainer[] = room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER,
            }) as any;
            room.find(FIND_DEPOSITS).forEach(s => {
                let near: StructureContainer = findNearTarget(s, cts);
                let pos = [s.pos.x, s.pos.y, s.pos.roomName];
                if (near) {
                    let far = w_utils.count_distance(s, near);
                    if (far <= 2) {
                        pos = [near.pos.x, near.pos.y, near.pos.roomName];
                    }
                }
                this.array.push({
                    room_name: room.name,
                    source_id: s.id,
                    resType: s.depositType,
                    creep_id: '',
                    update_tick: 0,
                    pos: pos,
                });
            });
            room.find(FIND_SOURCES).forEach(s => {
                let near: StructureContainer = findNearTarget(s, cts);
                let pos = [s.pos.x, s.pos.y, s.pos.roomName];
                if (near) {
                    let far = w_utils.count_distance(s, near);
                    if (far <= 2) {
                        pos = [near.pos.x, near.pos.y, near.pos.roomName];
                    }
                }
                this.array.push({
                    room_name: room.name,
                    source_id: s.id,
                    resType: RESOURCE_ENERGY,
                    creep_id: '',
                    update_tick: 0,
                    pos: pos,
                });
            });
        });
    }

    private updateState = () => {
        if (this.update_tick === Game.time) {
            return;
        }
        this.update_tick = Game.time;
        run_creep(w_role_name.harvester, creep => {
            const t_id = creep.memory.task_id;
            if (!t_id) {
                return;
            }
            const task = this.getTaskById(t_id);
            if (!task) {
                return;
            }
            if (task.update_tick === Game.time && task.creep_id) {
                creep.memory.task_id = undefined;
                return;
            }
            task.creep_id = creep.id;
            task.update_tick = Game.time;
        });
        this.array.forEach(t => {
            if (t.update_tick !== Game.time) {
                t.creep_id = '';
            }
        });
    };
    private run_harvest = (creep: Creep) => {
        let task = this.getTask(creep);
        if (creep.body.find(b => b.type === CARRY)) {
            if (is_more_than(creep, 0.8)) {
                const link = BaseRoom.findMineLink(creep, task.source_id);
                if (link) {
                    let code = creep.transfer(link, RESOURCE_ENERGY);
                    if (code === ERR_NOT_IN_RANGE) {
                        creep.moveTo(link as any);
                        return;
                    }
                }
            }
        }

        const nea = BaseRoom.findSpawnEnergyTarget(creep);
        console.log(creep.name);
        console.log('near energy spawn', nea?.pos);

        if (!task) {
            creep.say('no_task');
            return;
        }
        if (!task?.pos) {
            this.forgetTask(creep);
            return;
        }
        let [x, y, name] = task.pos;
        let pos = new RoomPosition(x, y, name);
        let far = moveToTarget(creep, pos);
        if (far < 2) {
            let tg = Game.getObjectById(task.source_id);
            creep.harvest(tg as any);
        }
    };
    private tryGiveLinkOrDrop = (creep: Creep) => {
        if (creep.body.find(b => b.type === CARRY)) {
            if (is_more_than(creep, 0.8)) {
                creep.say('more');
                const link = w_config.rooms[creep.room.name]?.link_a;
                if (link && link.length > 0) {
                    const links = link.map(id => Game.getObjectById(id)).filter(s => s);
                    let near: any = findNearTarget(creep, links);
                    if (near) {
                        let far = w_utils.count_distance(creep, near);
                        if (far <= 4) {
                            creep.say('link');
                            let code = creep.transfer(near, RESOURCE_ENERGY);
                            if (code === ERR_NOT_IN_RANGE) {
                                creep.moveTo(near as any);
                                return true;
                            }
                            if (code === OK) {
                                return false;
                            }
                        }
                    }
                } else {
                    creep.drop(RESOURCE_ENERGY);
                }
            }
        }
    };

    private getTask = (creep: Creep) => {
        // return ;
        // this.forgetTask(creep)
        // this.updateState();

        let t_id = creep.memory.task_id;
        if (t_id) {
            let task = this.getTaskById(t_id);
            if (task) {
                let cps = creep.room
                    .find(FIND_MY_CREEPS)
                    .filter(c => c.memory.role === w_role_name.harvester);
                let h = cps.find(c => c.memory.task_id === task.source_id && c.id !== creep.id);
                if (!h) {
                    return task;
                }
                // return task;
            }
        }
        this.updateState();
        let task = this.getTaskByOrder(creep);
        if (task) {
            task.creep_id = creep.id;
            creep.memory.task_id = task.source_id;
        }
        return task;
    };
    private forgetTask = (creep: Creep) => {
        let t_id = creep.memory.task_id;
        let tsk = this.getTaskById(t_id);
        creep.memory.task_id = undefined;
        if (tsk) {
            tsk.creep_id = '';
        }
    };
    private getTaskByOrder = (creep: Creep) => {
        let a = this.array.find(t => {
            if (t.room_name !== creep.room.name) {
                return false;
            }
            if (!t.creep_id) {
                return true;
            }
            let cp: Creep = Game.getObjectById(t.creep_id);
            if (!cp) {
                return true;
            }
            if (cp.ticksToLive < 200) {
                return true;
            }
        });
        if (a) {
            return a;
        }
        let bs = this.array.filter(t => t.room_name === creep.room.name);
        // return Array.from(bs).pop();
    };
    private getTaskById = (id: string) => {
        return this.array.find(t => t.source_id === id);
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
        run_creep(w_role_name.harvester, this.run_harvest);
    };
    private last_run_time = 0;
    public static cache_key = 'h_a_m_t';
    public static start = () => {
        let driver: HarvestAtMyRoom = w_cache.get(HarvestAtMyRoom.cache_key);
        if (!driver) {
            driver = new HarvestAtMyRoom();
            w_cache.set(HarvestAtMyRoom.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };
}

let driver: HarvestAtMyRoom = w_cache.get(HarvestAtMyRoom.cache_key);
if (!driver) {
    driver = new HarvestAtMyRoom();
    w_cache.set(HarvestAtMyRoom.cache_key, driver);
}
