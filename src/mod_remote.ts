import { harvestSource, isCreepStop, moveToTarget } from './lib_creep';
import { spawnCreep } from './mod_spawn_creep';

interface CacheRoom {
    remote_harvests: Creep[];
    source: CacheSource[];
}
const cache = new Map<string, CacheRoom>();

export function load_remote() {

    Object.values(Game.rooms).forEach(room => {

        if (!room.controller?.my) {
            return;
        }

        let cfg_reserve = w_config.rooms[room.name]?.reserve;
        if (!Array.isArray(cfg_reserve) || cfg_reserve.length === 0) {
            return;
        }
        const che: CacheGlobalRoom = w_cache.get(room.name);
        cfg_reserve.forEach(cfg => {
            const sc = cfg.sources.length;
            const harvest_count =
                che.remote[cfg.name].remote_role_count[w_role_name.harvester] || 0;
            if (harvest_count < sc) {
                return spawnCreep(
                    room,
                    w_role_name.harvester,
                    {
                        from: room.name,
                        remote: cfg.name,
                    },
                    true
                );
            }
        });
    });

}

// function prepareCache() {
//     Object.values(Game.creeps).forEach(creep => {
//         if (creep.memory.role !== w_role_name.remote_harvester) {
//             return;
//         }
//     });
// }

function run_remote_harvest(room: Room, config: CfgReserve) {}
