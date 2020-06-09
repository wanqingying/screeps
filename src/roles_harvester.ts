import { harvestSource } from './lib_creep';

const harvester = {} as Role;

harvester.setUp = function (creep) {
    harvestSource(creep);
};

w_roles.harvester = harvester as any;
