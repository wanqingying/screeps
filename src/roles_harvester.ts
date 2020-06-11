import { harvestSource } from './lib_creep';

const harvester = {} as Role;

harvester.setUp = function (creep) {
    creep.drop(RESOURCE_ENERGY);
    harvestSource(creep);
};

w_roles.harvester = harvester;
