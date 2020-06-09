import { findDropTargetSync, pickEnergyDrop, pickUpEnergyFromMine, transfer_nearby } from './lib_creep';
import { isEmpty, isFull } from './lib_base';

const carrier = {} as Role;

carrier.setUp = function (creep) {
    if (isEmpty(creep)) {
        creep.memory.process = 'pick';
        creep.memory.target_id = undefined;
    }
    if (isFull(creep)) {
        creep.memory.process = 'drop';
    }
    if (creep.memory.process === 'pick') {
        const code = pickEnergyDrop(creep);
        if (code===ERR_NOT_FOUND) {
            pickUpEnergyFromMine(creep);
        }
    } else {
        const act = transfer_nearby(
            creep,
            [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION],
            null,
            () => {
                creep.say('empty');
            }
        );
        if (act === ERR_NOT_FOUND) {
            transfer_nearby(creep, [
                STRUCTURE_SPAWN,
                STRUCTURE_TOWER,
                STRUCTURE_EXTENSION,
                STRUCTURE_CONTAINER,
            ]);
        }
    }
};

w_roles.carrier = carrier as any;
