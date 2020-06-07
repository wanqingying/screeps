import { run_creep } from './lib_creep';
import { get_creep_config, get_creep_body } from './config';

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

export function get_possible_max_energy(room: Room): number {
    let max = 0;
    room.memory.energy_rate.forEach(r => {
        if (r > max) {
            max = r;
        }
    });
    return Math.floor(max * room.energyCapacityAvailable);
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
    for (let i = 0; i < config.creep_order.length; i++) {
        const role = config.creep_order[i];
        const creeps = room.findBy(FIND_CREEPS, c => c.memory.role === role);
        const max = cfg[role].max;
        if (creeps.length < max) {
            spawn_creep(room, role);
            break;
        }
    }
}
