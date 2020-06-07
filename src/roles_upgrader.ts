import { findMaxEnergyWithDraw } from './lib_creep';

const upgrader = {} as Role;

upgrader.setUp = function (creep: Creep) {
    if (creep.memory.upgrading && creep.store.energy === 0) {
        creep.memory.upgrading = false;
        creep.say('find energy');
    }
    if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
        creep.memory.upgrading = true;
        creep.say('upgrade');
    }
    if (creep.memory.upgrading) {
        creep.say('upg');
        creep.upgradeController(creep.room.controller);
        creep.moveTo(creep.room.controller);
    } else {
        // if (pickUpMaxDropEnergy(creep, creep.store.getFreeCapacity())) {
        //     return;
        // }
        let cont = findMaxEnergyWithDraw(creep, [STRUCTURE_CONTAINER]);
        if (!cont) {
            findMaxEnergyWithDraw(creep);
        }
        creep.say('find');
    }
};

roles.upgrader = upgrader as any;
