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
    let cache_current: CacheGlobalRoom = { spawning: false };
    cache_current.spawning = room.find(FIND_MY_SPAWNS).some(s => s.spawning);
    w_utils.update_cache(room.name, cache_current);
}
