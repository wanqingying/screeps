import { is_empty_tate, is_full_tate, run_creep } from './lib_base';
import { TransportDriver } from 'mod_role_transport';


const war_part = [STRUCTURE_WALL, STRUCTURE_RAMPART];
const max_hits_rate = 0.8;
const min_hits_rate = 0.4;

interface Cache {
    c_structure: AnyStructure;
    c_war_rampart: AnyStructure;
}
const cache: { [k: string]: Cache } = {};
const cache_creep = {};

export function load_repair() {
    Object.values(Game.rooms).forEach(room => {
        if (room.controller?.my) {
            prepareCache(room);
        }
    });
    run_creep(w_role_name.repair, function (creep) {
        try {
            run_repair(creep);
        } catch (e) {
            console.log('err run_repair ', creep.name);
            console.log(e.message);
            console.log(e.stack);
        }
    });
}

// 工作优先级 :修复低血建筑,建造,修复高血建筑,修墙
export function run_repair(creep: Creep) {
    const che = cache[creep.room.name];
    if (!che) {
        return;
    }

    if (is_empty_tate(creep)) {
        creep.memory.process = 'pick';
        cache_creep[creep.id] = undefined;
    }
    if (is_full_tate(creep)) {
        creep.memory.process = 'r';
    }
    if (creep.memory.process === 'pick') {
        return TransportDriver.get_resource(creep);
    }

    let target;
    let cache_id = cache_creep[creep.id];
    if (cache_id) {
        target = Game.getObjectById<AnyStructure>(cache_id);
    }

    if (!target && che.c_structure) {
        const structure = che.c_structure;
        const rate_a = structure.hits / structure.hitsMax;
        if (rate_a < min_hits_rate) {
            target = structure;
        }
    }

    if (!target && che.c_war_rampart) {
        const war_target = che.c_war_rampart;
        if (war_target && war_target.hits < war_target.hitsMax) {
            target = war_target;
        }
    }
    if (target) {
        cache_creep[creep.id] = target.id;
        const code = creep.repair(target);
        if (code === ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    } else {
        creep.say('no target');
    }
}

function prepareCache(room: Room) {
    let che: Cache = { c_structure: null, c_war_rampart: null };
    let min_hits = 1;
    let min_war_hits = 999999999;
    room.find(FIND_STRUCTURES).forEach(s => {
        let rate = s.hits / s.hitsMax;
        if (war_part.includes(s.structureType as any)) {
            if (s.hits < min_war_hits) {
                min_war_hits = s.hits;
                che.c_war_rampart = s;
            }
            return;
        }
        if (rate < min_hits) {
            min_hits = rate;
            che.c_structure = s;
        }
    });
    cache[room.name] = che;
}
