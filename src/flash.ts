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
        room.spawns = room.findByFilter(FIND_STRUCTURES, 'structureType', [STRUCTURE_SPAWN]) as any;
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
            if (creep.ticksToLive >= 400 && creep.room.energyLack) {
                return stop_renew(creep);
            }
            if (creep.getRenewTime() > 100) {
                creep.log('renew ----- tick too long', creep.getRenewTime());
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
            if (creep.room.energyLack) {
                return;
            }
            // 同时回能量人数不能超过上限
            if (creep.room.memory.renew_count > 3) {
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
        });
    Object.values(Game.creeps).forEach(creep => {
        if (!creep.memory.cost) {
            let cost = 0;
            creep.body.forEach(b => {
                cost += w_config.internal.body_cost[b.type];
            });
            creep.memory.cost = cost;
        }
    });
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

flash();
