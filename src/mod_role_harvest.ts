import { getSourceWithContainer } from './lib_room';
import { isCreepStop, moveToTarget } from './lib_creep';
import { setTickOut } from './mod_tick_out';

interface Cache2 {
    source: Source;
    creeps: Creep[];
    container: StructureContainer | undefined;
}

const cache2: { [k: string]: Cache2[] } = {};

export function load_harvest() {
    Object.values(Game.rooms).forEach(room => {
        if (room.controller?.my) {
            prepareCache(room);
        }
    });
    Object.values(Game.creeps).forEach(creep => {
        if (isCreepStop(creep)) {
            return;
        }
        if (creep.memory?.role === w_role_name.harvester) {
            try {
                harvestSource(creep);
            } catch (e) {
                console.log('err load_harvest ', creep.name);
                console.log(e.message);
                console.log(e.stack);
            }
        }
    });
}

const cache = new Map();
function harvestSource(creep: Creep) {
    const che2: CacheGlobalRoom = w_cache.get(creep.room.name);
    let source = che2.source;
    let key = `${creep.id}_harvest_source_id`;
    let id = w_cache.get(key);
    let target;
    let ch = che2.source.find(s => s.creep_ids.length > 1);
    let sh = che2.source.find(s => s.creep_ids.length === 0);

    if (id) {
        let source = Game.getObjectById<Source>(id);
        if (ch && id === ch.source.id) {
            // 多人采一个矿 重新分配
            w_cache.delete(key);
        } else {
            target = source;
        }
    }
    if (!target) {
        if (!sh) {
            sh = source.sort((a, b) => {
                return a.creep_ids.length - b.creep_ids.length;
            })[0];
        }
        sh.creep_ids.push(creep.id);
        target = sh.source;
        w_cache.set(key, target.id);
    }
    if (!target) {
        w_cache.delete(key);
        return ERR_NOT_FOUND;
    }

    findAndMoveToSourcePos(creep, target, source);

    return creep.harvest(target);
}

function findAndMoveToSourcePos(creep: Creep, target: any, sources: CacheSource[]) {
    let sh = sources.find(t => t.source.id === target.id);
    if (sh?.container) {
        return moveToTarget(creep, sh.container.pos);
    } else {
        return moveToTarget(creep, target);
    }
}

function prepareCache(room: Room) {
    let sous: Cache2[] = getSourceWithContainer(room).map(s => ({
        source: s.source,
        container: s.container,
        creeps: [],
    }));
    cache2[room.name] = sous;
}
