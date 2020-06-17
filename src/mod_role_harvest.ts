import { harvestSource } from './lib_creep';
import { run_creep } from './lib_base';

export function load_harvest() {
    run_creep(w_role_name.harvester, function (creep) {
        try {
            harvestSource(creep);
        } catch (e) {
            console.log('err harvestSource', creep.name);
            console.log(e.message);
            console.log(e.stack);
        }
    });
}

// export class RoleHarvest {
//     private
// }
