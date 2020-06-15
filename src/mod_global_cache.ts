import { getSourceWithContainer, RemoteMine, RemoteTransport } from './lib_base';
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
    let rmc: RemoteMine = w_cache.get(w_code.REMOTE_KEY_MINE);
    if (!rmc) {
        rmc = new RemoteMine();
    }
    rmc.updateState();
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
    let che: RemoteTransport = w_cache.get(w_code.REMOTE_KEY_TRANSPORT);
    let che_from: CacheGlobalRoom = w_cache.get(from_room.name);
    let che_remote: CacheGlobalRoom = w_cache.get(room.name) || {};

    if (!che) {
        che = new RemoteTransport();
    } else {
        // che.resources ;
    }
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

    const res_type = RESOURCE_ENERGY;

    const drops = room.find(FIND_DROPPED_RESOURCES, { filter: c => c.amount > 100 });
    drops.forEach(d => {
        che.updateResource({
            from: from_room.name,
            remote: room.name,
            id: d.id,
            amount: d.amount,
            amountRec: 0,
            resourceType: d.resourceType,
            structureType: 'drop',
            pos: d.pos,
        });
    });
    const container: StructureContainer[] = room.find(FIND_MY_STRUCTURES, {
        filter: c => c.structureType === (STRUCTURE_CONTAINER as any),
    }) as any;
    container.forEach(t => {
        che.updateResource({
            from: from_room.name,
            remote: room.name,
            id: t.id,
            amount: t.store.getUsedCapacity(res_type),
            amountRec: 0,
            resourceType: res_type,
            structureType: t.structureType,
            pos: t.pos,
        });
    });

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
    w_cache.set(w_code.REMOTE_KEY_TRANSPORT, che);
}
