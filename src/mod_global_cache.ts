import { getSourceWithContainer } from './lib_base';

export function load_cache() {
    if (!global.w_cache) {
        global.w_cache = new Map<any, any>();
    }
    Object.values(Game.rooms).forEach(room => {
        if (room.controller?.my) {
            prepareCache(room);
        }
    });
}

function prepareCache(room: Room) {
    let obj: CacheGlobalRoom = { spawning: false, construction_site: [] };
    obj.spawning = room.find(FIND_MY_SPAWNS).some(s => s.spawning);
    obj.construction_site = room.find(FIND_MY_CONSTRUCTION_SITES);
    w_utils.update_cache(room.name, obj);
    const che: CacheGlobalRoom = w_cache.get(room.name);
    if (!che.source) {
        che.source = getSourceWithContainer(room).map(r => ({
            source: r.source,
            container: r.container,
            creep_ids: [],
        }));
    } else {
        che.source.forEach(c => (c.creep_ids = []));
    }
    room.find(FIND_MY_CREEPS).forEach(c => {
        let source_id_key = `${c.id}_harvest_source_id`;
        let source_id = w_cache.get(source_id_key);
        if (source_id) {
            const sh = che.source.find(s => s.source.id === source_id);
            sh.creep_ids.push(c.id);
        }
    });
}
