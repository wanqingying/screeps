// 不执行任何操作，只更新数据，用于之后的工作

function flash_game() {}

function flash_memory() {
    if (!Memory.creeps) {
        Memory.creeps = {};
    }
    if (!Memory.rooms) {
        Memory.rooms = {};
    }
    if (!Memory.rooms_h) {
        Memory.rooms_h = {};
    }
    Object.keys(Game.rooms).forEach(room_name => {
        if (!Memory.rooms_h[room_name]) {
            Memory.rooms_h[room_name] = { resource_energy: [] };
        }
    });
}

function flash_room() {
    Object.values(Game.rooms).forEach(room => {
        room.source_energy = [];
        room.find(FIND_SOURCES).forEach(source => {
            const cps = Object.values(Game.creeps)
                .map(creep => {
                    if (creep.memory.target_resource_id === source.id) {
                        return creep.name;
                    }
                })
                .filter(k => k);
            room.source_energy.push({ target: source, harvester: cps });
        });
    });
}

flash_game();
flash_memory();
flash_room();
