import { is_empty_tate, is_full_tate, isEmpty, isFull } from './lib_base';
import { isCreepStop, moveToTarget } from './lib_creep';
import { get_resource } from './mod_role_distribution';

export function load_upgrader() {
    Object.values(Game.creeps).forEach(creep => {
        if (isCreepStop(creep)) {
            return;
        }
        if (creep.memory?.role === w_role_name.upgrader) {
            try {
                run_upgrader(creep);
            } catch (e) {
                console.log('err run_upgrader ', creep.name);
                console.log(e.message);
                console.log(e.stack);
            }
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
        get_resource(creep, ['controller_container', STRUCTURE_STORAGE]);
        // get_resource(creep);
    }
}
