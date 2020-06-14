import {
    findNearTarget,
    findRepairTargetC,
    getActionLockTarget,
    is_empty_tate,
    is_full_tate,
    isEmpty,
    isFull,
} from './lib_base';
import { checkRepair, isCreepStop, moveToTarget } from './lib_creep';
import { get_resource } from './mod_role_distribution';
import { run_repair } from './mod_role_repair';

export function load_builder() {
    Object.values(Game.creeps).forEach(creep => {
        if (isCreepStop(creep)) {
            return;
        }
        if (creep.memory?.role === 'builder') {
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
        const pos = w_config.freePlace?.builder || { x: 25, y: 25 };
        moveToTarget(creep, new RoomPosition(pos.x, pos.y, creep.room.name));
        return;
    }

    if (creep.memory.building && is_empty_tate(creep)) {
        creep.memory.building = false;
        creep.say('g');
    }
    if (!creep.memory.building && is_full_tate(creep)) {
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
            creep.say('b');
            moveToTarget(creep, target, 2);
            if (act !== OK) {
                unLock();
            }
        } else {
            creep.say('r');
            unLock();
            run_repair(creep);
        }
    } else {
        creep.say('g');
        get_resource(creep);
    }
}

function repair_target(creep: Creep, _target: any) {
    const { target, unLock } = getActionLockTarget<StructureContainer>(
        creep,
        'check_repair_creep_cc',
        () => {
            return _target;
        }
    );

    if (!target) {
        unLock();
        return ERR_NOT_FOUND;
    }
    if (target.his / target.hisMax > 0.6) {
        unLock();
        return;
    }
    moveToTarget(creep, target, 2);
    let act = creep.repair(target);
    if (isEmpty(creep)) {
        unLock();
    }
    return act;
}
