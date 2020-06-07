import { find_nearby_target } from './lib_base';

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

function flash_room() {
    Object.values(Game.rooms).forEach(room => {
        // 初始化房间数据
        room.source_energy = [];
        if (!Array.isArray(room.memory.energy_rate)) {
            room.memory.energy_rate = [];
        }
        if (!Array.isArray(room.memory.energy_exist)) {
            room.memory.energy_exist = [];
        }
        if (!room.memory.structure) {
            room.memory.structure = { extension: 0 };
        }
        if (!room.memory.renew_count) {
            room.memory.renew_count = 0;
        }
        room.memory.creep_count = room.find(FIND_CREEPS).length;
        // 初始化能量资源
        room.find(FIND_SOURCES).forEach(source => {
            const cps = Object.values(Game.creeps)
                .map(creep => {
                    if (creep.memory.target_resource_id === source.id) {
                        return creep;
                    }
                })
                .filter(k => k && k.name);
            room.source_energy.push({ target: source, harvester: cps });
        });
        // 初始化extension
        const extensions = room.findBy(
            FIND_STRUCTURES,
            s => s.structureType === STRUCTURE_EXTENSION
        );
        room.memory.structure.extension = extensions.length;
        // 初始化能量状态
        let limit = config.internal.extension_limit[room.controller.level];
        if (extensions.length < limit) {
            room.log(`extension current/limit ${extensions.length}/${limit}`);
        }
        const energy = room.energyAvailable;
        const rate = room.energyAvailable / room.energyCapacityAvailable;
        room.memory.energy_rate.push(rate);
        room.memory.energy_exist.push(energy);
        let ex=room.memory.energy_exist;
        if (room.memory.energy_rate.length > config.energy_lack_tick) {
            room.memory.energy_rate.shift();
        }
        if (ex.length>config.energy_lack_tick){
            room.memory.energy_exist=ex.slice(-100)
        }
        room.memory.energy_lack =
            room.memory.energy_rate.every(rate => rate < config.energy_lack_rate) &&
            room.memory.energy_rate.length > 10;
        room.memory.energy_full = rate > 0.9999;
        room.memory.energy_stop = room.memory.energy_exist.every(r => r === 300);

        room.log(`energy ${energy}/${room.energyCapacityAvailable}`);
        // 初始化基地
        room.spawns = room.findBy(
            FIND_STRUCTURES,
            s => s.structureType === STRUCTURE_SPAWN
        ) as StructureSpawn[];

        // 初始化角色
        room.memory.role_exist = [];
        Object.values(role_name).forEach(role => {
            const rs = room.findBy(FIND_CREEPS, c => c.memory.role === role);
            room.memory.role_exist.push({ role: role, exist: rs.length });
        });
    });
}

function flash_creep() {
    Object.values(Game.creeps)
        .sort((a, b) => {
            return a.ticksToLive - b.ticksToLive;
        })
        .forEach(creep => {
            // 能量回复策略
            const life = creep.ticksToLive;
            // 正常回到 1450
            if (creep.ticksToLive >= 1450) {
                return stop_renew(creep);
            }
            // 缺能量时只需要回到400
            if (creep.ticksToLive >= 400 && creep.room.memory.energy_lack) {
                return stop_renew(creep);
            }
            // 大于 250 tick 不考虑
            if (life >= 250) {
                return;
            }
            // 两次间隔 200 tick
            if (Game.time - creep.memory.renew_tick < 200) {
                return;
            }
            // 缺能量不考虑
            if (creep.room.memory.energy_lack) {
                return;
            }
            // 同时回能量人数不能超过上限
            let rate = creep.room.memory.renew_count / creep.room.memory.creep_count;
            if (rate > config.renew_max_rate) {
                return;
            }
            const spawn = find_nearby_target(
                creep,
                creep.room.spawns.map(a => a.pos)
            );
            const far = count_distance(spawn, creep.pos);
            const danger = far + (250 - life) / 10;
            if (danger > 25) {
                start_renew(creep);
            }
        })
    Object.values(Game.creeps).forEach(creep=>{
        if (!creep.memory.cost){
            let cost=0;
            creep.body.forEach(b=>{
                cost+=config.internal.body_cost[b.type];
            })
            creep.memory.cost=cost;
        }

    })
}

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
