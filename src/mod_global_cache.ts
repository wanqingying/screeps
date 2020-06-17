import { getSourceWithContainer, RemoteAttack, RemoteReserve } from './lib_base';
import { get, set } from 'lodash';

export function load_cache() {
    try {
        load_global_cache();
    } catch (e) {
        console.log('err load_global_cache');
        console.log(e.message);
        console.log(e.stack);
    }
}

function load_global_cache() {
    if (!global.w_cache) {
        global.w_cache = new Map<any, any>();
    }

    // reserve
    let che_reserve: RemoteReserve = w_cache.get(w_code.REMOTE_KEY_RESERVE);
    if (!che_reserve) {
        che_reserve = new RemoteReserve();
    }
    che_reserve.tryUpdateState();
    w_cache.set(w_code.REMOTE_KEY_RESERVE, che_reserve);
    // remote_attack
    let che_atk: RemoteAttack = w_cache.get(w_code.REMOTE_KEY_ATTACK);
    if (!che_atk) {
        che_atk = new RemoteAttack();
    }
    che_atk.updateState();
    w_cache.set(w_code.REMOTE_KEY_ATTACK, che_atk);

    w_cache.set(w_code.REMOTE_KEY_RESERVE, che_reserve);
    Object.values(Game.rooms).forEach(room => {
        if (room.controller?.my) {
            prepareCache(room);

            const che: CacheGlobalRoom = w_cache.get(room.name) || {};
            const remotes = w_config.rooms[room.name]?.reserve || {};
            che.remotes = [];
            Object.keys(remotes).forEach(name => {
                che.remotes.push({ name: name });
                const remote_room = Game.rooms[name];
                if (remote_room) {
                    prepareRemoteCache(remote_room, room);
                }
            });
        }
    });
    Object.values(Game.creeps).forEach(c => {
        let remote_name = c.memory.remote;
        let role = c.memory.role;
        if (role === w_role_name.remote_harvester && remote_name) {
            const che: CacheGlobalRoom = w_cache.get(c.memory.from);
            let count: number =
                (get(che.remote, `${remote_name}.remote_role_count.${role}`) as any) || 0;
            set(che.remote, `${remote_name}.remote_role_count${role}`, count + 1);
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

function prepareRemoteCache(room: Room, from_room: Room) {
    let che_from: CacheGlobalRoom = w_cache.get(from_room.name);
    let che_remote: CacheGlobalRoom = w_cache.get(room.name) || {};

    // source缓存
    if (!che_remote.source) {
        che_remote.source = getSourceWithContainer(room).map(r => ({
            source: r.source,
            container: r.container,
            creep_ids: [],
        }));
    } else {
        che_remote.source.forEach(c => (c.creep_ids = []));
    }
    w_cache.set(room.name, che_remote);

    let cps = Object.values(Game.creeps).filter(
        v => v.memory.role === w_role_name.remote_harvester
    );

    let cf = che_from.remotes.find(c => c.name === room.name);
    cf.sources = getSourceWithContainer(room).map(s => {
        return {
            source: s.source,
            container: s.container,
            creep_names: cps
                .filter(c => c.memory.remote_source_id === s.source.id)
                .map(c => c.name),
        };
    });
}
