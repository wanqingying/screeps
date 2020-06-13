import { findNearTarget, findRepairTarget, getActionLockTarget, isEmpty, isFull } from './lib_base';
import { checkRepair, isCreepStop, moveToTarget } from './lib_creep';
import { get_resource } from './mod_role_distribution';

const repair_includes = [];
const repair_excludes = [];

export function load_builder() {
    Object.values(Game.creeps).forEach(creep => {
        if (isCreepStop(creep)) {
            return;
        }
        if (creep.memory?.role === w_role_name.builder) {
            try {
                run_builder(creep);
            } catch (e) {
                console.log('err run_builder ', creep.name);
                console.log(e.message);
                console.log(e.stack);
            }
        }
    });
}

// 工作优先级 :修复低血建筑,建造,修复高血建筑,修墙
function run_builder(creep: Creep) {
    if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0) {
        const pos = w_config.freePlace.builder;
        moveToTarget(creep, new RoomPosition(pos.x, pos.y, creep.room.name));
        return;
    }
    let target = get_repair_target(creep.room, [], [STRUCTURE_WALL, STRUCTURE_RAMPART]);
    if (target && target.hits < target.hitsMax / 3) {
        return repair_target(creep, target);
    }

    if (creep.memory.building && isEmpty(creep)) {
        creep.memory.building = false;
        creep.say('g');
    }
    if (!creep.memory.building && isFull(creep)) {
        creep.memory.building = true;
        creep.say('b');
    }

    if (creep.memory.building) {
        // 建筑
        let { target, unLock } = getActionLockTarget<any>(creep, 'builder_find', () => {
            let max_progress = 0;
            let targets = creep.room.find(FIND_CONSTRUCTION_SITES).map(c => {
                if (c.progress > max_progress) {
                    max_progress = c.progress;
                }
                return c;
            });
            targets = targets.filter(c => c.progress === max_progress);
            if (targets.length) {
                return findNearTarget(creep, targets);
            }
        });
        if (target) {
            let act = creep.build(target);
            moveToTarget(creep, target, 1);
            if (act !== OK) {
                unLock();
            }
        } else {
            unLock();
            checkRepair(creep, [STRUCTURE_WALL, STRUCTURE_RAMPART]);
        }
    } else {
        get_resource(creep);
    }
}

function get_repair_target(room: Room, includes?: any[], excludes?: any[]) {
    return room
        .findBy(FIND_MY_STRUCTURES, t => {
            if (includes && includes.length && !repair_includes.includes(t.structureType)) {
                return false;
            }
            if (excludes && excludes.length && repair_excludes.includes(t.structureType)) {
                return false;
            }
            return t.hits < (t.hitsMax * 4) / 5;
        })
        .sort((a, b) => {
            return a.hits - b.hits;
        })
        .shift();
}

function repair_target(creep: Creep, _target: any) {
    const { target, unLock } = getActionLockTarget(creep, 'check_repair_creep', () => {
        return _target;
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
