import { getEnergyUpgrader, moveToTarget, pickUpMaxDropEnergy } from './lib_creep';
import { find_nearby_target, isEmpty, isFull } from './lib_base';

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
        // online
        // let f = [STRUCTURE_SPAWN, STRUCTURE_STORAGE, STRUCTURE_CONTAINER, STRUCTURE_EXTENSION];
        // local
        let f = [STRUCTURE_STORAGE];
        getEnergyUpgrader(creep, f);
    }
};

w_roles.upgrader = upgrader as any;
