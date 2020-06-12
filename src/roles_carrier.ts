import { moveToTarget, pickUpFromMine, transferNearby } from './lib_creep';
import { isEmpty, isFull } from './lib_base';

const carrier = {} as Role;

carrier.setUp = function (creep) {
    if (isEmpty(creep)) {
        creep.memory.process = 'pick';
    }
    if (isFull(creep)) {
        creep.memory.process = 'drop';
    }

    if (creep.memory.process === 'pick') {
        pickUpFromMine(creep);
    } else {
        let act = transferNearby(creep);
        if (act === ERR_NOT_FOUND) {
            // let { x, y } = w_config.freePlace.carrier;
            // moveToTarget(creep, new RoomPosition(x, y, creep.room.name));
        }
    }
};

w_roles.carrier = carrier as any;
