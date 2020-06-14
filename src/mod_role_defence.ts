import { findAttackTarget } from './lib_room';
import { spawnCreep } from './mod_spawn_creep';
import { moveToTarget } from './lib_creep';

const attack=2;
const range_attack=3;
interface Cache {
    attack: any;
}
const cache: { [name: string]: Cache } = {};

export function load_defence() {
    Object.values(Game.rooms).forEach(room => {
        if (!room.controller?.my) {
            return;
        }
        try {
            prepareCache(room);
            defenceSpawnAttack(room);
            let cps = room.find(FIND_MY_CREEPS, {
                filter: c => c.memory.role === w_role_name.attack,
            });
            cps.forEach(creep => {
                run_defence(creep);
            });
        } catch (e) {
            console.log('err load_tower_logic ', room.name);
            console.log(e.message);
            console.log(e.stack);
        }
    });
}

function defenceSpawnAttack(room: Room) {
    let che = cache[room.name];
    if (che.attack) {
        return spawnCreep(room, w_role_name.attack);
    }
}

function run_defence(creep: Creep) {
    let che = cache[creep.room.name];
    let target = che.attack;
    if (target) {
        creep.attack(target);
        moveToTarget(creep, target);
    }
}

function prepareCache(room: Room) {
    let che = cache[room.name];
    if (!che) {
        che = { attack: null };
    }
    che.attack = findAttackTarget(room);
    cache[room.name] = che;
}
