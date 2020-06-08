import {
    get_creep_body,
    get_creep_body_cost,
    get_creep_config,
    get_possible_max_energy,
} from './config_creep';

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
    return room.sourceInfo.sort((a, b) => {
        return a.harvesters.length - b.harvesters.length;
    })[0];
}

export function spawn_creep(room: Room, role: role_name_key) {
    const body = get_creep_body(room, role);
    const index = get_index();
    const name = `${role}_${index}`;
    const spawns = room.findBy(FIND_STRUCTURES, t => t.structureType === STRUCTURE_SPAWN);
    if (spawns.length) {
        const spawn: StructureSpawn = spawns.pop() as StructureSpawn;
        const act = spawn.spawnCreep(body, name, {
            memory: { role: role, born_tick: Game.time, index: index },
        });
        if (act === OK) {
            room.memory.spawning = false;
        } else {
            room.memory.spawning = true;
            room.log(`spawn ${name} ` + get_code_msg_screeps(act));
        }
    }
}
export function get_index() {
    const mk = Object.values(Game.creeps).map(k => k.memory.index);
    for (let i = 0; i < mk.length + 1; i++) {
        if (!mk.includes(i)) {
            return i;
        }
    }
}

function prepare_spawn_creep(room: Room) {
    const cfg = get_creep_config(room);
    let q = room.memory.roleExist.sort((a, b) => {
        return a.exist - b.exist;
    });
    const harvester = room.memory.roleExist.find(r => r.role === role_name.harvester);
    const carrier = room.memory.roleExist.find(r => r.role === role_name.carrier);
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
    const energy_full = room.memory.energyFull;
    const cut = room.energyCapacityAvailable;
    const cs = room
        .findBy(FIND_CREEPS, c => {
            if (!c.memory?.role) {
                return false;
            }
            let max = get_creep_body_cost(room, c.memory.role);
            return c.memory?.cost < max;
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
    const creeps = room.findBy(FIND_CREEPS).sort((a, b) => {
        return a.memory?.cost - b.memory?.cost;
    });
    const cfg = get_creep_config(room);
    const role_exists = room.memory.roleExist;
    for (let j = 0; j < role_exists.length; j++) {
        let role_current = role_exists[j];
        const exist = role_current.exist;
        const max = cfg[role_current?.role]?.max;
        const del_role = role_current.role;
        if (exist > max) {
            for (let i = 0; i < creeps.length; i++) {
                let creep = creeps[i];
                if (!creep.memory?.role) {
                    creep.suicide();
                    return;
                }
                if (!del_role) {
                    return;
                }
                if (creep.memory.role === del_role) {
                    creep.suicide();
                    return;
                }
            }
        }
    }
}

// function prepare_() {
//
// }
