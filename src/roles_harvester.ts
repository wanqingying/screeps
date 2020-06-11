import { harvestSource } from './lib_creep';

const harvester = {} as Role;

harvester.setUp = function (creep) {
    creep.drop(RESOURCE_ENERGY);
    let code=harvestSource(creep);
    console.log(w_utils.get_code_msg(code));
};

w_roles.harvester = harvester;
