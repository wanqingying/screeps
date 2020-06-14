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
    const che2 = cache2[creep.room.name];
    let key = `${creep.id}_harvest`;
    let id = cache.get(key);
    let target;
    if (id) {
        target = Game.getObjectById(id);
    } else {
        let sh = che2.find(s => s.creeps.length < 1);
        if (!sh) {
            sh = che2[0];
        }
        if (sh) {
            sh.creeps.push(creep);
            target = sh.source;
            cache.set(key, target.id);
        }
    }
    if (!target) {
        cache.delete(key);
        return ERR_NOT_FOUND;
    }
    // 临死前发布定时任务 重新配对 避免拥挤
    if (creep.ticksToLive < 5) {
        setTickOut(10, () => {
            Array.from(cache.keys()).forEach(k => cache.delete(k));
        });
    }

    findAndMoveToSourcePos(creep, target, che2);

    return creep.harvest(target);
}

function findAndMoveToSourcePos(creep: Creep, target: any, sources: Cache2[]) {
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
