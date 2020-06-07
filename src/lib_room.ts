import { get_creep_body, get_creep_config, get_possible_max_energy } from './config_creep';

export function prepare_room(room: Room): boolean {
    check_tower(room);
    prepare_spawn_creep(room);
    prepare_kill_creep(room);
    prepare_kill_more_creep(room);
    return false;
}

function check_tower(room: Room) {
    const towers = room.findBy(
        FIND_STRUCTURES,
        t => t.structureType === STRUCTURE_TOWER
    ) as StructureTower[];
    for (let i = 0; i < towers.length; i++) {
        const tower = towers[i];
        const target_heal = find_heal_target(room);
        if (target_heal) {
            tower.heal(target_heal);
            continue;
        }
        const target_repair = find_repair_target(room);
        if (target_repair) {
            tower.repair(target_repair);
            continue;
        }
        const target_attack = find_attack_target(room);
        if (target_attack) {
            tower.attack(target_attack);
            continue;
        }
        room.log('tower no target');
    }
}
function find_heal_target(room: Room): AnyCreep {
    return room
        .findBy(FIND_CREEPS, t => t.hits < t.hitsMax)
        .sort((a, b) => {
            return a.hits - b.hits;
        })[0];
}
function find_repair_target(room: Room): AnyStructure {
    return room
        .findBy(FIND_STRUCTURES, t => t.hits < t.hitsMax)
        .sort((a, b) => {
            return a.hits - b.hits;
        })[0];
}
function find_attack_target(room: Room): AnyCreep {
    return null as any;
}
export function find_source_min_harvester(room: Room) {
    return room.source_energy.sort((a, b) => {
        return a.harvester.length - b.harvester.length;
    })[0];
}

export function spawn_creep(room: Room, role: role_name_key) {
    const body = get_creep_body(room, role);
    const name = `${role}_${Game.time}`;
    const spawns = room.findBy(FIND_STRUCTURES, t => t.structureType === STRUCTURE_SPAWN);
    if (spawns.length) {
        const spa: StructureSpawn = spawns.pop() as StructureSpawn;
        const act = spa.spawnCreep(body, name, { memory: { role: role, born_tick: Game.time } });
        if (act === OK) {
            room.memory.spawning = false;
        } else {
            room.memory.spawning = true;
            room.log(`spawn ${role} ` + get_code_msg_screeps(act));
        }
    }
}

function prepare_spawn_creep(room: Room) {
    const cfg = get_creep_config(room);
    let q = room.memory.role_exist.sort((a, b) => {
        return a.exist - b.exist;
    });
    const harvester = room.memory.role_exist.find(r => r.role === role_name.harvester);
    const carrier = room.memory.role_exist.find(r => r.role === role_name.carrier);
    if (harvester.exist === 0) {
        return spawn_creep(room, 'harvester');
    }
    if (carrier.exist === 0) {
        return spawn_creep(room, 'carrier');
    }
    q = Array.from(q);
    let me = q.shift();
    // let target_exist=room.findBy(FIND_CREEPS, c => c.memory.role === min_exist_role.role).length;

    while (q.length && me.exist >= cfg[me.role].max) {
        me = q.shift();
    }
    if (me.exist >= cfg[me.role].max) {
        return;
    }
    spawn_creep(room, me.role as any);

    // for (let i = 0; i < config.creep_order.length; i++) {
    //     const role = config.creep_order[i];
    //     const creeps = room.findBy(FIND_CREEPS, c => c.memory.role === role);
    //     const max = cfg[role].max;
    //     if (creeps.length < max) {
    //         spawn_creep(room, role);
    //         break;
    //     }
    // }
}
function prepare_kill_creep(room: Room) {
    // 单位更新换代
    const energy_full = room.memory.energy_full;
    const cut = room.energyCapacityAvailable;
    const cs = room
        .findBy(FIND_CREEPS, c => {
            return c.memory?.cost < Math.max(cut / 2, cut - 100, 200);
        })
        .sort((a, b) => {
            return a.memory?.cost - b.memory?.cost;
        });
    let tg = cs.shift();
    if (tg && energy_full && !room.memory.spawning) {
        tg.log('die auto ');
        tg.suicide();
        return;
    }
}

function prepare_kill_more_creep(room: Room) {
    const cps = room.findBy(FIND_CREEPS).sort((a, b) => {
        return a.memory?.cost - b.memory?.cost;
    });
    const cfg = get_creep_config(room);
    const ex = room.memory.role_exist;
    for (let j = 0; j < ex.length; j++) {
        let r = ex[j];
        const exist = r.exist;
        const max = cfg[r.role].max;
        if (exist > max) {
            for (let i = 0; i < cps.length; i++) {
                let c = cps[i];
                if (c.memory.role === r.role) {
                    c.suicide();
                    return;
                }
            }
        }
    }
}

// function prepare_() {
//
// }
