import { get_creep_body, get_creep_config, get_possible_max_energy } from './config_creep';

export function prepare_room(room: Room): boolean {
    check_tower(room);
    prepare_creep(room);
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

function prepare_creep(room: Room) {
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
// export function get_creep_config(room: Room): RoomCreepCfg {
//     return {
//         [role_name.starter]: { max: 0 },
//         [role_name.carrier]: { max: 2 },
//         [role_name.builder]: { max: 2 },
//         [role_name.harvester]: { max: 2 },
//         [role_name.upgrader]: { max: 1 },
//     };
// }
// export function get_possible_max_energy(room: Room): number {
//     let max = 0;
//     room.memory.energy_rate.forEach(r => {
//         if (r > max) {
//             max = r;
//         }
//     });
//     return Math.floor(max * room.energyCapacityAvailable);
// }
// export function get_creep_body(room: Room, role: role_name_key) {
//     let energy_max = room.energyCapacityAvailable;
//     const energy_lack = room.memory.energy_lack;
//     let body = [MOVE, MOVE, CARRY, CARRY, WORK];
//
//     if (energy_lack) {
//         energy_max = get_possible_max_energy(room);
//         return [WORK, MOVE, CARRY];
//     }
//     if (room.memory.energy_stop){
//         energy_max=300
//     }
//     let n;
//     switch (role) {
//         case 'builder':
//             n = Math.floor(energy_max / 200);
//             return get_repeat_body(n, [MOVE, CARRY, WORK]);
//         case 'carrier':
//             n = Math.floor(energy_max / 100);
//             return get_repeat_body(n, [MOVE, CARRY]);
//         case 'harvester':
//             let mk = 0;
//             if (energy_max <= 400) {
//                 mk = 2;
//             }
//             if (energy_max <= 550) {
//                 mk = 3;
//             }
//             if (energy_max <= 850) {
//                 mk = 4;
//             }
//             n = Math.floor((energy_max - mk * 50) / 100);
//             let mv = new Array(mk).fill(MOVE);
//             let wk = new Array(n).fill(WORK);
//             return mv.concat(wk);
//         case 'starter':
//             return body;
//         case 'upgrader':
//             n = Math.floor(energy_max / 200);
//             return get_repeat_body(n, [MOVE, CARRY, WORK]);
//     }
// }
//
// function get_repeat_body(n: number, part: any[]) {
//     let bd = [];
//     for (let i = 0; i < n; i++) {
//         bd = bd.concat(part);
//     }
//     return bd;
// }
