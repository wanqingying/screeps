import { harvestSource, isCreepStop, moveToTarget } from './lib_creep';

export function load_scout() {
    Object.values(Game.creeps).forEach(creep => {
        if (isCreepStop(creep)) {
            return;
        }
        if (creep.memory?.role === w_role_name.scout) {
            creep.moveTo(new RoomPosition(40, 40, 'W3N7'));
        }
    });
}
