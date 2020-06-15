import { isEmpty, getActionLockTarget, findRepairTargetC } from './lib_base';

export function harvestSource(creep: Creep, remote?) {
    const che2: CacheGlobalRoom = w_cache.get(creep.room.name);
    let source = che2.source;
    let key = `${creep.id}_harvest_source_id`;
    let id = w_cache.get(key);
    let target;

    let ch = source.find(s => s?.creep_ids?.length > 1);
    let sh = source.find(s => s?.creep_ids?.length === 0);

    if (id) {
        let source = Game.getObjectById<Source>(id);
        if (ch && id === ch.source.id) {
            // 多人采一个矿 重新分配
            // w_cache.delete(key);
        } else {
            target = source;
        }
    }
    if (!target) {
        if (!sh) {
            let time_out_miner = source.find(s => {
                return s.creep_ids.find(sid => Game.getObjectById<Creep>(sid).ticksToLive < 100);
            });
            // 无缝交接
            if (time_out_miner) {
                sh = time_out_miner;
            } else {
                // sh = source.sort((a, b) => {
                //     return a.creep_ids.length - b.creep_ids.length;
                // })[0];
            }
        }
        if (sh) {
            sh.creep_ids.push(creep.id);
            target = sh.source;
            w_cache.set(key, target.id);
        }
    }
    if (!target) {
        w_cache.delete(key);
        return ERR_NOT_FOUND;
    }

    findAndMoveToSourcePos(creep, target, source);

    return creep.harvest(target);
}

function getRemoteSource(room: Room) {}

function findAndMoveToSourcePos(creep: Creep, target: any, sources: CacheSource[]) {
    let sh = sources.find(t => t.source.id === target.id);
    if (sh?.container) {
        return moveToTarget(creep, sh.container.pos);
    } else {
        return moveToTarget(creep, target);
    }
}
export function moveToTarget(creep: Creep, target: RoomPosition, dis?: number) {
    const far = w_utils.count_distance(creep.pos, target);
    if (far > (dis || 0)) {
        creep.moveTo(target);
    }
    return far;
}

export function checkRepair(creep: Creep, include?: any[], exclude?: any[]): ScreepsReturnCode {
    const { target, unLock } = getActionLockTarget(creep, 'check_repair_creep', () => {
        return findRepairTargetC(creep, include, exclude);
    });

    if (!target) {
        return ERR_NOT_FOUND;
    }
    moveToTarget(creep, target);
    let act = creep.repair(target);
    if (isEmpty(creep)) {
        unLock();
    }
    return act;
}

export function isCreepStop(creep: Creep) {
    if (creep.spawning) {
        return true;
    }
    return false;
}
const w = global.w_role_name;

export function getCreepBodyByRole(role: role_name_key, maxEnergy: number) {
    if (role === w_role_name.starter) {
        return { [MOVE]: 2, [WORK]: 1, [CARRY]: 2 };
    }
    if (role === w_role_name.scout) {
        return { [MOVE]: 1, [CARRY]: 0 };
    }
    if (role === w_role_name.claim) {
        return { [MOVE]: 1, [CLAIM]: 1 };
    }
    let cfg = getCreepBodyCfg(maxEnergy);
    return cfg[role];
}

//========0====1====2====3====4=====5=====6====7======8
// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]
export function getCreepBodyCfg(maxEnergy: number) {
    //300
    if (maxEnergy < 550) {
        return {
            [w.carrier]: { [MOVE]: 1, [CARRY]: 2 },
            [w.remote_carry]: { [MOVE]: 1, [CARRY]: 2 },
            [w.harvester]: { [MOVE]: 1, [WORK]: 2, [CARRY]: 0 },
            [w.remote_harvester]: { [MOVE]: 2, [WORK]: 2, [CARRY]: 0 },
            [w.builder]: { [MOVE]: 2, [WORK]: 1, [CARRY]: 2 },
            [w.upgrader]: { [MOVE]: 2, [WORK]: 1, [CARRY]: 2 },
            [w.repair]: { [MOVE]: 2, [WORK]: 1, [CARRY]: 2 },
            [w.attack]: { [TOUGH]: 5, [MOVE]: 3, [ATTACK]: 1 },
        };
    }
    // 550
    if (maxEnergy < 800) {
        return {
            [w.carrier]: { [MOVE]: 3, [CARRY]: 6 },
            [w.remote_carry]: { [MOVE]: 3, [CARRY]: 6 },
            [w.remote_harvester]: { [MOVE]: 2, [WORK]: 2, [CARRY]: 0 },
            [w.harvester]: { [MOVE]: 1, [WORK]: 5, [CARRY]: 0 },
            [w.builder]: { [MOVE]: 3, [WORK]: 2, [CARRY]: 4 },
            [w.upgrader]: { [MOVE]: 1, [WORK]: 4, [CARRY]: 1 },
            [w.repair]: { [MOVE]: 2, [WORK]: 1, [CARRY]: 3 },
            [w.attack]: { [TOUGH]: 5, [MOVE]: 3, [ATTACK]: 1 },
        };
    }
    // 800
    if (maxEnergy < 1300) {
        return {
            [w.carrier]: { [MOVE]: 4, [CARRY]: 8 },
            [w.remote_carry]: { [MOVE]: 4, [CARRY]: 8 },
            [w.harvester]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 0 },
            [w.remote_harvester]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 0 },
            [w.builder]: { [MOVE]: 4, [WORK]: 3, [CARRY]: 5 },
            [w.upgrader]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 1 },
            [w.repair]: { [MOVE]: 4, [WORK]: 3, [CARRY]: 5 },
            [w.attack]: { [TOUGH]: 5, [MOVE]: 3, [ATTACK]: 1 },
        };
    }
    // 1300
    if (maxEnergy < 1800) {
        return {
            [w.carrier]: { [MOVE]: 5, [CARRY]: 10 },
            [w.remote_carry]: { [MOVE]: 5, [CARRY]: 10 },
            [w.harvester]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 0 },
            [w.remote_harvester]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 0 },
            [w.builder]: { [MOVE]: 5, [WORK]: 5, [CARRY]: 5 },
            [w.upgrader]: { [MOVE]: 2, [WORK]: 10, [CARRY]: 2 },
            [w.repair]: { [MOVE]: 4, [WORK]: 3, [CARRY]: 5 },
            [w.attack]: { [TOUGH]: 5, [MOVE]: 3, [ATTACK]: 0 },
        };
    }
    // 1800
    if (maxEnergy < 2300) {
        return {
            [w.carrier]: { [MOVE]: 5, [CARRY]: 10 },
            [w.remote_carry]: { [MOVE]: 5, [CARRY]: 10 },
            [w.harvester]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 0 },
            [w.remote_harvester]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 0 },
            [w.builder]: { [MOVE]: 5, [WORK]: 5, [CARRY]: 5 },
            [w.upgrader]: { [MOVE]: 2, [WORK]: 10, [CARRY]: 2 },
            [w.repair]: { [MOVE]: 4, [WORK]: 3, [CARRY]: 5 },
            [w.attack]: { [TOUGH]: 5, [MOVE]: 3, [ATTACK]: 0 },
        };
    }
    // 2300
    if (maxEnergy < 5300) {
        return {
            [w.carrier]: { [MOVE]: 5, [CARRY]: 10 },
            [w.remote_carry]: { [MOVE]: 5, [CARRY]: 10 },
            [w.harvester]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 0 },
            [w.remote_harvester]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 0 },
            [w.builder]: { [MOVE]: 5, [WORK]: 5, [CARRY]: 5 },
            [w.upgrader]: { [MOVE]: 2, [WORK]: 10, [CARRY]: 2 },
            [w.repair]: { [MOVE]: 4, [WORK]: 3, [CARRY]: 5 },
            [w.attack]: { [TOUGH]: 5, [MOVE]: 3, [ATTACK]: 0 },
        };
    }
    // 5300
    if (maxEnergy <= 12300) {
        return {
            [w.carrier]: { [MOVE]: 5, [CARRY]: 10 },
            [w.harvester]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 0 },
            [w.remote_harvester]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 0 },
            [w.builder]: { [MOVE]: 5, [WORK]: 5, [CARRY]: 5 },
            [w.upgrader]: { [MOVE]: 2, [WORK]: 10, [CARRY]: 2 },
            [w.repair]: { [MOVE]: 4, [WORK]: 3, [CARRY]: 5 },
            [w.attack]: { [TOUGH]: 5, [MOVE]: 3, [ATTACK]: 0 },
        };
    }
}
