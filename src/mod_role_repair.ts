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

    if (isFull(creep)) {
        creep.memory.process = 'work';
    }
    if (isEmpty(creep)) {
        creep.memory.process = 'pick';
        cache_creep[creep.id] = undefined;
    }
    if (creep.memory.process === 'pick') {
        cache_creep[creep.id] = undefined;
        return get_resource(creep);
    }

    const structure = che.c_his_structure;
    const rate_structure = structure.hits / structure.hitsMax;

    let target;
    let cache_id = cache_creep[creep.id];
    if (cache_id) {
        let cache_target = Game.getObjectById<AnyStructure>(cache_id);
        if (cache_target) {
            // 如果缓存对象的hits未达到目标 继续
            let rate_cache = cache_target.hits / cache_target.hitsMax;
            if (war_part.includes(cache_target.structureType as any)) {
                // 如果有低血建筑,优先低血建筑
                if (rate_structure >= max_hits_rate) {
                    target = cache_target;
                }
            } else if (rate_cache < max_hits_rate) {
                target = cache_target;
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
        const war_target = che.war_part;
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
    if (isEmpty(creep)) {
        cache_creep[creep.id] = undefined;
    }
}

function prepareCache(room: Room) {
    let che: Cache = { c_his_structure: null, war_part: null };
    let min_hits = 1;
    let min_war_hits = 999999999;
    room.find(FIND_STRUCTURES).forEach(s => {
        let rate = s.hits / s.hitsMax;
        if (war_part.includes(s.structureType as any)) {
            if (s.hits < min_war_hits) {
                min_war_hits = s.hits;
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
