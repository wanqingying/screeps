import { moveToTarget, pickUpDropOrFromMineContainer, transfer_nearby } from './lib_creep';
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
        let code = pickUpDropOrFromMineContainer(creep);
        if (code === ERR_NOT_FOUND) {
        }
    } else {
        let act = transfer_nearby(
            creep,
            [
                STRUCTURE_SPAWN,
                STRUCTURE_EXTENSION,
                STRUCTURE_TOWER,
                STRUCTURE_CONTAINER,
                STRUCTURE_STORAGE,
            ],
            null
        );
        if (act === ERR_NOT_FOUND) {
            let { x, y } = w_config.freePlace.carrier;
            moveToTarget(creep, new RoomPosition(x, y, creep.room.name));
        }
    }
};

w_roles.carrier = carrier as any;
