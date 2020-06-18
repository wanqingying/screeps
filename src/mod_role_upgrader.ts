import { is_less_than, is_more_than, isEmpty, isFull, run_creep } from './lib_base';
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
    if (isEmpty(creep)) {
        creep.memory.upgrading = false;
    }
    if (isFull(creep)) {
        creep.memory.upgrading = true;
    }
    if (creep.memory.upgrading) {
        creep.say('u');
        creep.upgradeController(creep.room.controller);
        moveToTarget(creep, creep.room.controller.pos, 1);
    } else {
        creep.say('g');
        let link_d = Array.from(w_config.rooms[creep.room.name]?.link_d || []).pop();
        if (link_d) {
            let link: StructureLink = Game.getObjectById(link_d);
            if (link) {
                let cap = link.store.getUsedCapacity(RESOURCE_ENERGY);
                if (cap > 0) {
                    moveToTarget(creep, link, 1);
                    creep.withdraw(link, RESOURCE_ENERGY);
                }
                creep.say('hi' + cap);
                return;
            }
        }
        TransportDriver.get_resource(creep, ['controller_container', STRUCTURE_STORAGE]);
    }
}
