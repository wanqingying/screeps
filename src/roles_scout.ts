import { harvestSource, transfer_nearby } from './lib_creep';
import { isEmpty, isFull } from './lib_base';

const scout = {} as Role;


scout.setUp = function (creep) {
    if (isFull(creep)) {
        creep.memory.process = 'drop';
    }
    if (isEmpty(creep)) {
        creep.memory.process = 'dig';
    }

    if (creep.memory.process !== 'drop') {
        harvestSource(creep);
    }
    if (creep.memory.process === 'drop') {
        const empty = transfer_nearby(creep);
        if (empty) {
            creep.memory.process = 'dig';
        }
    }
};


w_roles.scout = scout as any;
