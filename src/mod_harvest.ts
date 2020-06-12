import { getSourceWithContainer } from './lib_room';
import { getActionLockTarget, getCreepBodyNum } from './lib_base';
import { moveToTarget } from './lib_creep';

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

export function load_harvest() {
    Object.values(Game.rooms).forEach(room => {
        if (room.controller?.my) {
            prepareCache(room);
        }
    });
    Object.values(Game.creeps).forEach(creep => {
        if (creep.memory?.role === w_role_name.harvester && !creep.spawning) {
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

function harvestSource(creep: Creep) {
    const che = getCache(creep.room);
    const { target, unLock } = getActionLockTarget(creep, 'harvest_source', () => {
        let sourceH = che.sources.sort((a, b) => {
            return a.work - b.work;
        });
        let t = Array.from(sourceH).shift();
        if (t) {
            t.work += getCreepBodyNum(creep, WORK);
        }
        return t?.source;
    });

    if (!target) {
        unLock();
        return ERR_NOT_FOUND;
    }

    if (target.energy === 0 && target.ticksToRegeneration > 500) {
        // 资源采尽时切换目标
        unLock();
        return ERR_NOT_FOUND;
    }

    findAndMoveToSourcePos(creep, target, che.sources);
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
