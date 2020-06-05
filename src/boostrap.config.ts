const names: (keyof Memory)[] = [
    'resource_energy',
    'creeps_spawn_index',
    'creeps',
    'powerCreeps',
    'flags',
    'rooms',
    'spawns',
];
export const config = {
    start: {
        creeps: {
            builder: { count: 3 },
            upgrader: { count: 3 },
            harvester: { count: 3 },
        },
    },
    // 重新召唤名字错误的creep
    creep_check_name: false,
    creep_kill_all: false,
    creep_spawn_on: true,
    path_config_mine:{ visualizePathStyle: { stroke: '#ffaa00' } },
    rooms: {
        W2N8: {
            name: 'W2N8',
            spawn_name: 'Spawn1',
            resource_energy_ids: ['ad7c07746802348', '2484077468064e9'],
            resource_energy_nums: [2, 2],
        },
    },
    memory_key_names: names,
    log_on: true,
};
