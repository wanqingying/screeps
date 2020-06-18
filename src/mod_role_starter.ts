import { getSourceWithContainer } from './lib_room';
import { is_less_than, is_more_than } from './lib_base';
import { harvestSource } from './lib_creep';
import { TransportDriver } from './mod_role_transport';

interface CacheSource {
    source: Source;
    container: StructureContainer | undefined;
    work: number;
}
interface CacheRoom {
    sources: CacheSource[];
    tick?: number;
}
const cache_rooms: { [name: string]: CacheRoom } = {};

export function load_starter() {
    Object.values(Game.rooms).forEach(room => {
        if (!room.controller?.my) {
            return;
        }
        prepareCache(room);

        let che: CacheGlobalRoom = w_cache.get(room.name);
        let role_count = che.creep_role_count;
        let no_start = role_count[w_role_name.harvester] > 1 && role_count[w_role_name.carrier] > 1;

        room.find(FIND_MY_CREEPS).forEach(creep => {
            if (creep.spawning) {
                return false;
            }
            if (creep.memory?.role === w_role_name.starter) {
                if (no_start) {
                    creep.suicide();
                }
                try {
                    run_starter(creep);
                } catch (e) {
                    console.log('err load_harvest ', creep.name);
                    console.log(e.message);
                    console.log(e.stack);
                }
            }
        });
    });
}

function run_starter(creep: Creep) {
    if (is_less_than(creep)) {
        creep.memory.process = 'dig';
    }
    if (is_more_than(creep)) {
        creep.memory.process = null;
    }

    if (creep.memory.process === 'dig') {
        harvestSource(creep);
    } else {
        TransportDriver.giv_resource(creep);
    }
}

function getCache(room: Room): CacheRoom {
    let che: CacheRoom = cache_rooms[room.name];
    if (!che?.tick) {
        che = {
            tick: Game.time,
            sources: [],
        };
        cache_rooms[room.name] = che;
    }
    che.tick = Game.time;
    return che;
}

function updateCache(room: Room, newState: CacheRoom) {
    let che = getCache(room);
    cache_rooms[room.name] = Object.assign(che, newState);
}

function prepareCache(room: Room) {
    const sources: CacheSource[] = getSourceWithContainer(room).map(m => {
        return { source: m.source, container: m.container, work: 0 };
    });
    updateCache(room, { sources: sources });
}
