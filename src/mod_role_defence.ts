import { findAttackTarget } from './lib_room';
import { spawnCreep } from './mod_spawn_creep';
import { moveToTarget } from './lib_creep';

const attack = 2;
const range_attack = 3;
interface Cache {
    attack: any;
    my_attack_creeps: number;
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
    if (che.attack && room.name !== 'sim') {
        return spawnCreep(room, w_role_name.attack, {}, true);
    }
}

function run_defence(creep: Creep) {
    let che = cache[creep.room.name];
    let target = che.attack;
    if (target && che.my_attack_creeps >= 0) {
        creep.attack(target);
        moveToTarget(creep, target);
    }
}

function prepareCache(room: Room) {
    let che = cache[room.name];
    if (!che) {
        che = { attack: null, my_attack_creeps: 0 };
    }
    let t = findAttackTarget(room);
    if (t && t.ticksToLive > 100 && t.hits > 1500) {
        che.attack = t;
    }
    che.my_attack_creeps = room.find(FIND_MY_CREEPS, {
        filter: s => s.memory.role === w_role_name.attack,
    }).length;
    cache[room.name] = che;
}
