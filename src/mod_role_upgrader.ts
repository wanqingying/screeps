import { is_empty_tate, is_full_tate, run_creep } from './lib_base';
import { moveToTarget } from './lib_creep';
import { TransportDriver } from './mod_role_transport';

export function load_upgrader() {
    run_creep(w_role_name.upgrader, function (creep) {
        try {
            run_upgrader(creep);
        } catch (e) {
            console.log('err run_upgrader ', creep.name);
            console.log(e.message);
            console.log(e.stack);
        }
    });
}

function run_upgrader(creep: Creep) {
    if (is_empty_tate(creep)) {
        creep.memory.upgrading = false;
    }
    if (is_full_tate(creep)) {
        creep.memory.upgrading = true;
    }
    if (creep.memory.upgrading) {
        creep.say('u');
        creep.upgradeController(creep.room.controller);
        moveToTarget(creep, creep.room.controller.pos);
    } else {
        creep.say('g');
        TransportDriver.get_resource(creep, ['controller_container', STRUCTURE_STORAGE]);
    }
}
