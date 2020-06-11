import {
    getEnergyUpgrader,
    moveToTarget,
    pickUpDropEnergy,
    pickUpDropOrFromStructure,
} from './lib_creep';
import { findNearTarget, isEmpty, isFull } from './lib_base';

const upgrader = {} as Role;

upgrader.setUp = function (creep: Creep) {
    if (isEmpty(creep)) {
        creep.memory.upgrading = false;
    }
    if (isFull(creep)) {
        creep.memory.upgrading = true;
    }
    if (creep.memory.upgrading) {
        creep.say('u');
        creep.upgradeController(creep.room.controller);
        moveToTarget(creep, creep.room.controller.pos);
    } else {
        creep.say('g');
        // let f = [STRUCTURE_STORAGE];
        pickUpDropOrFromStructure(creep);
    }
};

w_roles.upgrader = upgrader as any;
