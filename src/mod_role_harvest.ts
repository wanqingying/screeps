import { getSourceWithContainer } from './lib_room';
import { findNearTarget, getActionLockTarget, getCreepBodyNum } from './lib_base';
import { isCreepStop, moveToTarget } from './lib_creep';

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

function harvestSource(creep: Creep) {
    const che = getCache(creep.room);
    const { target, unLock } = getActionLockTarget(creep, 'harvest_source', () => {
        let sh = Array.from(che.sources);

        let has_container;
        let min_work = 99;
        sh.forEach(s => {
            if (s.container) {
                has_container = true;
            }
            if (s.work < min_work) {
                min_work = s.work;
            }
        });
        console.log(creep.room.name, 'harvest=====');
        console.log(JSON.stringify(sh.map(s => ({ id: s.source.id, work: s.work }))));
        console.log(min_work);
        sh = sh.filter(s => s.work === min_work);
        if (has_container) {
            sh = sh.filter(s => s.container);
        }

        let ch = findNearTarget<Source>(
            creep.room.controller,
            sh.map(s => s.source)
        );

        if (ch) {
            let t = sh.find(s => s.source.id === ch.id);
            t.work += getCreepBodyNum(creep, WORK);
        }
        return ch;
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
