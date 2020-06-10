import {findDropTargetSync, moveToTarget, pickEnergyDrop, pickUpEnergyFromMine, transfer_nearby} from './lib_creep';
import { isEmpty, isFull } from './lib_base';

const carrier = {} as Role;

carrier.setUp = function (creep) {
    if (isEmpty(creep)) {
        creep.memory.process = 'pick';
        creep.memory.target_id = undefined;
    }
    if (isFull(creep)) {
        creep.memory.process = 'drop';
    }

    if (creep.memory.process === 'pick') {
        creep.log_one('pick')
        const code = pickEnergyDrop(creep);
        if (code===ERR_NOT_FOUND) {
            pickUpEnergyFromMine(creep);
        }
    } else {
        creep.log_one('drop')
        let act = transfer_nearby(
            creep,
            [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION],
            null,
        );

        if (act === ERR_NOT_FOUND) {
            transfer_nearby(creep, [
                STRUCTURE_SPAWN,
                STRUCTURE_TOWER,
                STRUCTURE_EXTENSION,
                STRUCTURE_CONTAINER,
            ]);
        }
        if (act===ERR_NOT_FOUND){
            moveToTarget(creep,new RoomPosition(28,40,creep.room.name))
        }
    }
};

w_roles.carrier = carrier as any;
