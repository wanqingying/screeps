import { isEmpty, isFull, isNotFull } from './lib_base';
import { isCreepStop } from './lib_creep';
import { get_resource } from './mod_role_distribution';

const war_part = [STRUCTURE_WALL, STRUCTURE_RAMPART];
const max_hits_rate = 0.8;
const min_hits_rate = 0.4;

interface Cache {
    c_his_structure: AnyStructure;
    war_part: AnyStructure;
}
const cache: { [k: string]: Cache } = {};
const cache_creep = {};

export function load_repair() {
    Object.values(Game.rooms).forEach(room => {
        if (room.controller?.my) {
            prepareCache(room);
        }
    });

    Object.values(Game.creeps).forEach(creep => {
        if (isCreepStop(creep)) {
            return;
        }
        if (creep.memory?.role === w_role_name.repair) {
            try {
                run_repair(creep);
            } catch (e) {
                console.log('err run_repair ', creep.name);
                console.log(e.message);
                console.log(e.stack);
            }
        }
    });
}

// 工作优先级 :修复低血建筑,建造,修复高血建筑,修墙
function run_repair(creep: Creep) {
    const che = cache[creep.room.name];
    let target;
    let cache_id = cache_creep[creep.id];

    if (isFull(creep)) {
        creep.memory.process = 'work';
    }
    if (isEmpty(creep)) {
        creep.memory.process = 'pick';
        cache_creep[creep.id] = undefined;
    }
    if (creep.memory.process === 'pick') {
        return get_resource(creep);
    }

    const structure = che.c_his_structure;
    const rate_a = structure.hits / structure.hitsMax;

    if (cache_id) {
        let cache_t = Game.getObjectById<AnyStructure>(cache_id);
        if (cache_t) {
            let rate_c = cache_t.hits / cache_t.hitsMax;
            if (war_part.includes(cache_t.structureType as any)) {
                if (rate_a >= min_hits_rate) {
                    target = cache_t;
                }
            } else if (rate_c < max_hits_rate) {
                target = cache_t;
            }
        }
    }

    if (!target) {
        const structure = che.c_his_structure;
        const rate_a = structure.hits / structure.hitsMax;
        if (rate_a < min_hits_rate) {
            target = structure;
        }
    }

    if (!target) {
        const w_t = che.war_part;
        if (w_t && w_t.hits < w_t.hitsMax) {
            target = w_t;
        }
    }

    if (target) {
        creep.say('r');
        cache_creep[creep.id] = target.id;
        const code = creep.repair(target);
        if (code === ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    } else {
        creep.say('no target');
    }
    if (isEmpty(creep)) {
        cache_creep[creep.id] = undefined;
    }
}

function prepareCache(room: Room) {
    let che: Cache = { c_his_structure: null, war_part: null };
    let min_hits = 1;
    let min_war_hits = 99999999;
    room.find(FIND_STRUCTURES).forEach(s => {
        let rate = s.hits / s.hitsMax;
        if (war_part.includes(s.structureType as any)) {
            if (s.hits < min_war_hits) {
                min_war_hits = rate;
                che.war_part = s;
            }
            return;
        }
        if (rate < min_hits) {
            min_hits = rate;
            che.c_his_structure = s;
        }
    });
    cache[room.name] = che;
}
