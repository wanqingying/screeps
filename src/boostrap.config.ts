
const names: (keyof Memory)[] = [
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
    rooms: { W2N8: { name: 'W2N8', spawn_name: 'Spawn1' } },
    memory_key_names: names,
    log_on: true,
};


