import { config } from './config';
import { check_screeps, spawn_creep, log, spawn_role } from './utils.uta';

export function check_state() {
    log_energy();
    flush_memory();
    flush_creeps();
    spawn_role_on_start();
}

function flush_creeps() {
    if (config.creep_kill_all) {
        Object.values(Game.creeps).forEach(c => c.suicide());
    }
    check_screeps();
    if (config.creep_kill_more) {
        kill_more_creep();
    }
    renew_creeps();
}

function renew_creeps() {
    let spawn = Game.spawns[config.rooms[config.room_name_1].spawn_name];
    // if (spawn.store.getUsedCapacity(RESOURCE_ENERGY) < 5000) {
    //     Memory.renew_creeps.forEach(p => {
    //         let creep = Game.creeps[p.name];
    //         creep.memory.role = creep.memory.renew_role;
    //     });
    //     Memory.renew_creeps = [];
    //     return;
    // }
    Memory.renew_creeps = Memory.renew_creeps.filter(c => {
        return Game.creeps[c.name];
    });
    Object.values(Game.creeps).forEach(c => {
        if (c.ticksToLive < config.renew_min && c.memory.role !== 'renew') {
            Memory.renew_creeps.push({ name: c.name, ticks: c.ticksToLive });
            c.memory.renew_role = c.memory.role;
            c.memory.role = 'renew';
        }
    });
    Object.values(Game.creeps)
        .filter(c => c.memory.role === 'renew')
        .forEach(creep => {
            if (creep.ticksToLive > config.renew_max) {
                creep.memory.role = creep.memory.renew_role;
                return;
            }
            creep.say('renew');
            if (spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn);
            }
        });

    let cps = Memory.renew_creeps.filter(p => {
        let creep = Game.creeps[p.name];
        if (creep.ticksToLive > config.renew_max) {
            creep.memory.role = creep.memory.renew_role;
            return false;
        } else {
            return true;
        }
    });
    Memory.renew_creeps = cps;
}

function kill_more_creep() {
    let role_cfg = config.creep_spawn_role;
    for (let i = 0; i < role_cfg.length; i++) {
        let cfg = role_cfg[i];
        Object.keys(Memory.creeps)
            .filter(k => Memory.creeps[k].role === cfg.role)
            .forEach((k, i) => {
                if (i + 1 > cfg.count) {
                    Game.creeps[k].suicide();
                }
            });
    }
}

function flush_memory() {
    if (!Array.isArray(Memory.creeps_spawn_index)) {
        Memory.creeps_spawn_index = [];
    }
    if (!Array.isArray(Memory.renew_creeps)) {
        Memory.renew_creeps = [];
    }
    Object.keys(Memory).forEach(k => {
        if (!config.memory_key_names.includes(k as any)) {
            delete Memory[k];
        }
    });

    if (!Memory.resource_energy) {
        Memory.resource_energy = {};
    }
    config.rooms[config.room_name_1].resource_energy_ids.forEach(id => {
        if (!Memory.resource_energy[id]) {
            Memory.resource_energy[id] = { miners: [] };
        }
        let pre = Memory.resource_energy[id].miners;
        pre = pre.filter(name => Game.creeps[name]);
        Memory.resource_energy[id].miners = pre;
    });
    Object.keys(Memory.creeps).forEach(name => {
        let targetId = Memory.creeps[name].target_resource_id;
        let target = Memory.resource_energy[Memory.creeps[name].target_resource_id];
        if (target && !target.miners.includes(name)) {
            Memory.resource_energy[targetId].miners.push(name);
        }
        if (!Memory.creeps[name].role) {
            delete Memory.creeps[name];
            if (Game.creeps[name]) {
                Game.creeps[name].suicide();
            }
        }
    });
    Object.keys(Memory.resource_energy).forEach(k=>{
        let t=Game.getObjectById(k);
        if (!t){
            delete Memory.resource_energy[k]
        }
    })
}

function spawn_role_on_start() {
    let role_cfg = config.creep_spawn_role;
    let creep_count = Object.keys(Game.creeps).length;
    let starter = config.creep_spawn_role.find(r => r.role === 'starter');
    if (creep_count < starter.count && creep_count < 6) {
        spawn_role(starter.role as RoleName);
        return;
    }
    if (creep_count > 6) {
        Object.values(Game.creeps).forEach(c => {
            if (c.memory.role === 'starter') {
                c.suicide();
            }
        });
    }
    for (let i = 0; i < role_cfg.length; i++) {
        let cfg = role_cfg[i];

        if (cfg.role === 'starter') {
            continue;
        }
        let current = Object.keys(Memory.creeps).filter(
            k => Memory.creeps[k].role === cfg.role || Memory.creeps[k].renew_role === cfg.role
        ).length;
        log(`${cfg.role} : ${current}/${cfg.count}`);
        if (current < cfg.count) {
            spawn_role(cfg.role as RoleName);
            return;
        }
    }
}

function log_energy() {
    let room_name = config.rooms[config.room_name_1].name;
    let room_target = Game.rooms[room_name];
    let eng = room_target.energyAvailable;
    log('energy/capacity:', `${eng}/${room_target.energyCapacityAvailable}`);
}

function spawn_starter(n: number) {
    switch (n) {
        case 0:
        case 1:
        case 2:
        case 3:
            return spawn_creep({
                body: [MOVE, WORK, CARRY],
                role: 'starter',
            });
    }
}

export function check_structure() {
    let room = Game.rooms[config.rooms[config.room_name_1].name];
    let extensions = room.find(FIND_STRUCTURES, { filter: s => s.structureType === 'extension' });
    extensions.forEach(ext => {
        let meet = config.rooms[config.room_name_1].extension_pos.find(
            pos => ext.pos.x === pos.x && ext.pos.y === pos.y
        );
        if (!meet) {
            ext.destroy();
        }
    });
    config.rooms[config.room_name_1].extension_pos.forEach(pos => {
        let exist = extensions.find(ext => ext.pos.x === pos.x && ext.pos.y === pos.y);
        if (!exist) {
            let code = room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
            if (code !== 0) {
                log('STRUCTURE_EXTENSION:', code);
            }
        } else {
            // console.log('exist', exist.id, exist.isActive());
        }
    });
    tower_reaper();
}

function tower_reaper() {
    let tower = Game.getObjectById<StructureTower>(config.rooms[config.room_name_1].tower_id);
    if (tower) {
        let targets = tower.room
            .find(FIND_STRUCTURES, {
                filter: stu => {
                    return stu.hits < stu.hitsMax;
                },
            })
            .sort((a, b) => {
                return b.hits - a.hits;
            });
        tower.repair(targets.pop());
    }
}
