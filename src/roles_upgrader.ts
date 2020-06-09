import { findMaxEnergyWithDraw, pickUpMaxDropEnergy } from './lib_creep';
import { find_nearby_target } from './lib_base';

const upgrader = {} as Role;

upgrader.setUp = function (creep: Creep) {
    if (creep.memory.upgrading && creep.store.energy === 0) {
        creep.memory.upgrading = false;
        creep.say('find');
    }
    if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
        creep.memory.upgrading = true;
    }
    if (creep.memory.upgrading) {
        creep.say('up');
        creep.upgradeController(creep.room.controller);
        creep.moveTo(creep.room.controller);
    } else {
        const containers = creep.room.findBy(
            FIND_STRUCTURES,
            t => t.structureType === STRUCTURE_CONTAINER
        );
        const target = find_nearby_target(creep, containers) as any;
        let cont = findMaxEnergyWithDraw(creep, [STRUCTURE_CONTAINER]);
        if (target) {
            if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
            cont = true;
        }
        if (w_config.upgrader_only_container) {
            return;
        }
        if (!cont) {
            cont = pickUpMaxDropEnergy(creep);
        }
        if (!cont && !creep.room.spawning) {
            findMaxEnergyWithDraw(creep);
        } else {
            creep.say('wait');
        }
    }
};

w_roles.upgrader = upgrader as any;
