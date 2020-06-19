import {
    findNearTarget,
    getActionLockTarget,
    is_less_than,
    is_more_than,
    run_creep,
} from './lib_base';
import { moveToTarget } from './lib_creep';
import { TransportDriver } from './mod_role_transport';

import { run_repair } from './mod_role_repair';

export function load_builder() {
    run_creep(w_role_name.builder, function (creep) {
        try {
            run_builder(creep);
        } catch (e) {
            g_log('err run_builder ', creep.name);
            g_log(e.message);
            g_log(e.stack);
        }
    });
}

// 工作优先级 :修复低血建筑,建造,修复高血建筑,修墙
function run_builder(creep: Creep) {
    if (creep.memory.building && is_less_than(creep)) {
        creep.memory.building = false;
        creep.say('g');
    }
    if (!creep.memory.building && is_more_than(creep)) {
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
        TransportDriver.get_resource(creep);
        // creep.say('get')
    }
}
