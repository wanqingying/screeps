import { roomList } from './bootstrap.constant';
import { config } from './boostrap.config';

import { check_screeps, spawn_creep, log } from './utils.uta';

export function check_state() {
    flush_memory();
    flush_creeps();
    let creep_count = Object.keys(Game.creeps).length;
    let lit = 5;
    if (creep_count < lit && config.creep_spawn_on) {
        spawn_creeps_on_start(creep_count);
    }

    // roomList.forEach(name => {
    //     let room = Game.rooms[name];
    //     if (!room) {
    //         Memory.errors.push('room not exist ' + name)
    //     } else {
    //         check_room_state(room)
    //     }
    // })
}

export function check_room_state(room: Room) {
    Memory.rooms[room.name] = room;
}

function flush_creeps() {
    if (config.creep_kill_all) {
        Object.values(Game.creeps).forEach(c => c.suicide());
    }
    check_screeps();
}

function flush_memory() {
    if (!Array.isArray(Memory.creeps_spawn_index)) {
        Memory.creeps_spawn_index = [];
    }
    Object.keys(Memory).forEach(k => {
        if (!config.memory_key_names.includes(k as any)) {
            delete Memory[k];
        }
    });
}

function spawn_creeps_on_start(n: number) {
    let room_name = config.rooms.W2N8.name;
    let room_target = Game.rooms[room_name];
    let spawn_target = Game.spawns[room_name];
    let eng = room_target.energyAvailable;
    log('energy/capacity:', `${eng}/${room_target.energyCapacityAvailable}`);
    log(n);
    switch (n) {
        case 0:
        case 1:
        case 2:
        case 3:
            return spawn_creep({
                body: [MOVE, WORK, WORK, CARRY],
                role: 'starter',
            });
    }
}
