import { moveToTarget } from './lib_creep';
import { run_creep } from './lib_base';

export function load_scout() {
    try {
        start_scout();
    } catch (e) {
        g_log('err start_scout ');
        g_log_err(e.message);
        g_log_err(e.stack);
    }
}
function start_scout() {
    const has_scout_rooms = [];
    run_creep(w_role_name.scout, function (creep) {
        if (creep.memory.scout_target) {
            has_scout_rooms.push(creep.memory.scout_target);
        }
    });
    run_creep(w_role_name.scout, function (creep) {
        const from = creep.memory.from;
        // in born room
        if (creep.room.name === from) {
            if (creep.memory.scout_target) {
                // move to target room
                creep.moveTo(new RoomPosition(25, 25, creep.memory.scout_target));
            } else {
                // get adn move to target room
                let reserves = w_config.rooms[from].reserve || {};
                let scout = w_config.rooms[from].scout || [];
                let targets: string[] = [].concat(scout).concat(Object.keys(reserves));
                let target = targets.find(t => !has_scout_rooms.includes(t));
                if (target) {
                    creep.memory.scout_target = target;
                    has_scout_rooms.push(target);
                    creep.moveTo(new RoomPosition(25, 25, target));
                }
            }
        } else if (creep.room.name !== creep.memory.scout_target) {
            moveToTarget(creep, new RoomPosition(25, 25, creep.memory.scout_target), 6);
        }
        if (creep.room.name === creep.memory.scout_target) {
            moveToTarget(creep, new RoomPosition(25, 25, creep.memory.scout_target), 9);
        }
    });
}
