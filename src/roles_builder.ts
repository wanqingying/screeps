import {
    pickUpDropEnergy,
    getEnergyUpgrader,
    moveToTarget,
    checkRepair,
    pickUpDropOrFromStructure,
} from './lib_creep';
import { findRepairTarget, getActionLockTarget, isEmpty, isFull } from './lib_base';

const builder = {} as Role;

builder.setUp = function (creep) {
    if (creep.memory.building && isEmpty(creep)) {
        creep.memory.building = false;
        creep.memory.process = 'get';
        creep.say('store');
    }
    if (!creep.memory.building && isFull(creep)) {
        creep.memory.building = true;
        creep.memory.process = 'build';
        creep.say('build');
    }

    if (creep.memory.building) {
        // 建筑,维修,
        let { target, unLock } = getActionLockTarget<any>(creep, 'builder_find', () => {
            let targets = creep.room.find(FIND_CONSTRUCTION_SITES).sort((a, b) => {
                return a.progress - b.progress;
            });
            if (targets.length) {
                return targets.pop();
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
            let act = checkRepair(creep, [STRUCTURE_WALL, STRUCTURE_RAMPART]);
            if (act === ERR_NOT_FOUND) {
                moveToTarget(creep, new RoomPosition(24, 41, creep.room.name));
            }
        }
    } else {
        pickUpDropOrFromStructure(creep);
    }
};

w_roles.builder = builder as any;
