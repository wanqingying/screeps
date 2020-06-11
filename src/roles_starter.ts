import { harvestSource, transferNearby } from './lib_creep';
import { isEmpty, isFull } from './lib_base';

const starter = {} as Role;

starter.setUp = function (creep) {
    if (isFull(creep)) {
        creep.memory.process = 'drop';
    }
    if (isEmpty(creep)) {
        creep.memory.process = 'dig';
    }

    if (creep.memory.process !== 'drop') {
        creep.say_one(w_debug_creep, 'dig');
        harvestSource(creep);
    }
    if (creep.memory.process === 'drop') {
        creep.say_one(w_debug_creep, 'drop');
        const empty = transferNearby(creep);
        if (empty) {
            creep.memory.process = 'dig';
        }
    }
};

w_roles.starter = starter as any;
