import { harvestSource, transfer_nearby } from './lib_creep';
import { isEmpty, isFull, isNotFull } from './lib_base';

const harvester = {} as Role;

harvester.setUp = function (creep) {
    // if (isFull(creep)) {
    //     creep.memory.process = 'drop';
    // }
    creep.drop(RESOURCE_ENERGY)
    harvestSource(creep);

    // if (isNotFull(creep)) {
    //     creep.log_one('a')
    //     harvestSource(creep);
    // } else {
    //     creep.log_one('b')
    //
    //     transfer_nearby(creep);
    // }

    // if (creep.memory.process !== 'drop') {
    //     harvestSource(creep);
    // }
    // if (creep.memory.process === 'drop') {
    //     const empty = transfer_nearby(creep);
    //     if (empty) {
    //         creep.memory.process = 'dig';
    //     }
    // }
    // harvestSource(creep);
};

w_roles.harvester = harvester as any;
