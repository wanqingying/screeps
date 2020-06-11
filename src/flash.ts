import { findNearTarget } from './lib_base';

// 不执行任何操作，只更新数据，用于之后的工作

function flash_game() {}

function flash_memory() {
    if (!Memory.creeps) {
        Memory.creeps = {};
    }
    if (!Memory.rooms) {
        Memory.rooms = {};
    }

    const current_ids: string[] = Object.values(Game.creeps).map(creep => {
        const exist_m = Memory.creeps[creep.name];
        if (!exist_m) {
            creep.log('not exist on memory');
        }
        if (!creep.memory.id) {
            creep.memory.id = creep.id;
        }
        return creep.id;
    });

    Object.keys(Memory.creeps).forEach(name => {
        const creep = Memory.creeps[name];
        if (!current_ids.includes(creep.id)) {
            delete Memory.creeps[name];
        }
    });
}

function flash_room() {}

function flash_creep() {}

function stop_renew(creep: Creep) {
    creep.memory.renew_tick = Game.time;
    creep.memory.renew = false;
    creep.room.memory.renew_count--;
    creep.memory.renew_spawn_id = undefined;
}

function start_renew(creep: Creep) {
    creep.memory.renew = true;
    creep.room.memory.renew_count++;
}

export function flash() {
    flash_game();
    flash_memory();
    flash_room();
    flash_creep();
}
