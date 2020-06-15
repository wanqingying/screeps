import { harvestSource, isCreepStop, moveToTarget } from './lib_creep';
import { role_name } from './config_a_role_name';
import { spawnCreep } from './mod_spawn_creep';

interface CacheRoom {
    remote_harvests: Creep[];
    source: CacheSource[];
}
const cache = new Map<string, CacheRoom>();

export function load_remote_harvest() {
    // const cps = Object.values(Game.creeps).filter(
    //     c => c.memory.role === w_role_name.remote_harvester
    // );
    prepareCache();
    Object.values(Game.rooms).forEach(room => {
        if (!room.controller?.my) {
            return;
        }

        let che: CacheGlobalRoom = w_cache.get(room.name);
        if (!Array.isArray(che.remotes) || che.remotes.length === 0) {
            return;
        }

        room.find(FIND_MY_CREEPS, {
            filter: c => c.memory.role === w_role_name.remote_harvester,
        }).forEach(creep => {
            const target = che.remotes.find(r => r.sources.find(s => s.creep_names.length === 0));
            if (!target) {
                return;
            }
            let m = target.sources.find(s => s.creep_names.length === 0);
            if (!m) {
                return;
            }
            creep.memory.remote_source_id = m.source.id;
            creep.moveTo(m.source);
        });
    });

    Object.values(Game.creeps).forEach(creep => {
        if (isCreepStop(creep)) {
            return;
        }
        if (creep.memory?.role !== w_role_name.remote_harvester) {
            return;
        }
        if (creep.memory.from !== creep.room.name) {
            try {
                harvestSource(creep, 'remote');
            } catch (e) {
                console.log('err remote_harvest ', creep.name);
                console.log(e.message);
                console.log(e.stack);
            }
        }
    });
}

function prepareCache() {
    Object.values(Game.creeps).forEach(creep => {
        if (creep.memory.role !== w_role_name.remote_harvester) {
            return;
        }
    });
}
