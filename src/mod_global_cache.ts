import { getSourceWithContainer } from './lib_base';

export function load_cache() {
    if (!global.w_cache) {
        global.w_cache = new Map<any, any>();
    }
    Object.values(Game.rooms).forEach(room => {
        const remotes = w_config.rooms[room.name]?.reserve || [];
        if (room.controller?.my) {
            prepareCache(room);
            remotes.forEach(r => {
                const remote_room = Game.rooms[r.name];
                if (remote_room) {
                    prepareCache(remote_room);
                }
            });
        }
    });
    Object.values(Game.creeps).forEach(c => {
        let remote_name = c.memory.remote;
        let role = c.memory.role;
        if (role === w_role_name.harvester && remote_name) {
            const che: CacheGlobalRoom = w_cache.get(c.memory.from);
            const count = che.remote[remote_name].remote_role_count[role] || 0;
            che.remote[remote_name].remote_role_count[role] = count + 1;
        }
    });
}

function prepareCache(room: Room) {
    const che: CacheGlobalRoom = w_cache.get(room.name) || {};

    che.construction_site = room.find(FIND_MY_CONSTRUCTION_SITES);

    // source缓存
    if (!che.source) {
        che.source = getSourceWithContainer(room).map(r => ({
            source: r.source,
            container: r.container,
            creep_ids: [],
        }));
    } else {
        che.source.forEach(c => (c.creep_ids = []));
    }
    // if (!room.controller?.my) {
    //     w_utils.update_cache(room.name, che);
    //
    //     return;
    // }
    // 外矿缓存
    // const cfg_a = w_config.rooms[room.name]?.reserve || [];
    // if (!che.remote) {
    //     che.remote = {};
    // }
    // cfg_a.forEach(cfg => {
    //     che.remote[cfg.name] = { remote_role_count: {} };
    // });
    // let remote_sources = [];
    // cfg_a.forEach(cfg => {
    //     const remote_room = Game.rooms[cfg.name];
    //     if (!remote_room) {
    //         return;
    //     }
    //     const cps=remote_room.find(FIND_MY_CREEPS,{filter:c=>c.memory.role===w_role_name.harvester});
    //
    //     const rs = getSourceWithContainer(room).map(r => ({
    //         source: r.source,
    //         container: r.container,
    //         creep_ids: [],
    //     }));
    //     remote_sources = remote_sources.concat(rs);
    // });
    // che.remote_source = remote_sources;
    // reserve缓存

    // 单位缓存
    const creep_count: any = {};
    Object.values(w_role_name).forEach(role => {
        creep_count[role] = 0;
    });
    room.find(FIND_MY_CREEPS).forEach(c => {
        let source_id_key = `${c.id}_harvest_source_id`;
        let source_id = w_cache.get(source_id_key);
        if (source_id) {
            const sh = che.source.find(s => s.source.id === source_id);
            sh.creep_ids.push(c.id);
        }
        creep_count[c.memory.role] += 1;
    });
    che.creep_role_count = creep_count;

    w_utils.update_cache(room.name, che);
}
