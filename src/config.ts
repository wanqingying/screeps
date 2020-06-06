const names: (keyof Memory)[] = [
    'resource_energy',
    'creeps_spawn_index',
    'creeps',
    'powerCreeps',
    'flags',
    'rooms',
    'renew_creeps',
    'spawns',
];
const config_online = {
    creep_spawn_role: [
        { role: 'worker', count: 2, body: { [MOVE]: 2, [WORK]: 2 } },
        {
            role: 'carry',
            count: 2,
            // 800
            body: { [MOVE]: 2, [CARRY]: 4 },
        },
        { role: 'builder', count: 4, body: { [MOVE]: 3, [CARRY]: 7, [WORK]: 3 } },
        // 800
        {
            role: 'upgrader',
            count: 2,
            // 800
            body: { [MOVE]: 2, [CARRY]: 2, [WORK]: 6 },
        },
        { role: 'harvester', count: 0, body: [MOVE, CARRY, WORK] },
        { role: 'heal', count: 0, body: [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, HEAL] },
        { role: 'starter', count: 1, body: [MOVE, CARRY, WORK, WORK] },
        {
            role: 'container_carry',
            count: 4,
            // 800
            body: { [MOVE]: 4, [CARRY]: 12 },
        },
    ],
    creep_spawn_starter: 2,
    // 重新召唤名字错误的creep
    creep_check_name: false,
    creep_kill_all: false,
    creep_kill_more: true,
    creep_spawn_on: true,
    // path_config_mine: { visualizePathStyle: { stroke: '#ffaa00' } },
    path_config_mine: {},
    rooms: {
        W2N8: {
            name: 'W2N8',
            spawn_name: 'Spawn1',
            resource_energy_ids: ['ad7c07746802348', '2484077468064e9', '9d330774017e6b9'],
            resource_energy_nums: [1, 1, 0],
            extension_pos: [
                { x: 42, y: 9 },
                { x: 42, y: 8 },
                { x: 43, y: 8 },
                { x: 43, y: 9 },
                { x: 38, y: 15 },
                { x: 27, y: 4 },
                { x: 28, y: 4 },
                { x: 29, y: 4 },
                { x: 30, y: 4 },
                { x: 31, y: 4 },
            ],
            tower_id: 'af41925331a4dcd',
        },
    },
    room_name_1: 'W2N8',
    memory_key_names: names,
    log_on: true,
    renew_min: 150,
    renew_max: 1400,
};

const config_local = {
    creep_spawn_role: [
        { role: 'worker', count: 2, body: { [MOVE]: 2, [WORK]: 6 } },
        {
            role: 'carry',
            count: 2,
            // 800
            body: { [MOVE]: 3, [CARRY]: 13 },
        },
        { role: 'builder', count: 4, body: { [MOVE]: 3, [CARRY]: 7, [WORK]: 3 } },
        // 800
        {
            role: 'upgrader',
            count: 2,
            // 800
            body: { [MOVE]: 2, [CARRY]: 2, [WORK]: 6 },
        },
        { role: 'harvester', count: 0, body: [MOVE, CARRY, WORK] },
        { role: 'heal', count: 0, body: [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, HEAL] },
        { role: 'starter', count: 1, body: [MOVE, CARRY, WORK, WORK] },
        {
            role: 'container_carry',
            count: 4,
            // 800
            body: { [MOVE]: 4, [CARRY]: 12 },
        },
    ],
    creep_spawn_starter: 2,
    // 重新召唤名字错误的creep
    creep_check_name: false,
    creep_kill_all: false,
    creep_kill_more: true,
    creep_spawn_on: true,
    // path_config_mine: { visualizePathStyle: { stroke: '#ffaa00' } },
    path_config_mine: {},
    rooms: {
        E34N9: {
            name: 'E34N9',
            spawn_name: 'Spawn1',
            resource_energy_ids: [
                '5bbcaeed9099fc012e639cb2',
                '5bbcaeed9099fc012e639cb3',
                '9d330774017e6b9',
            ],
            resource_energy_nums: [1, 1, 0],
            extension_pos: [
                // { x: 31, y: 4 },
            ],
            tower_id: 'af41925331a4dcd',
        },
    },
    room_name_1: 'E34N9',
    memory_key_names: names,
    log_on: true,
    renew_min: 150,
    renew_max: 1400,
};

let cfg: typeof config_local | typeof config_online;
if (Game.shard.name === 'LAPTOP-B07N3SVP') {
    cfg = config_local;
} else {
    cfg = config_online;
}

export const config = cfg;
