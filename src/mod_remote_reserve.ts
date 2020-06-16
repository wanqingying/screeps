import { moveToTarget } from './lib_creep';
import { RemoteReserve, run_creep } from './lib_base';
import { checkRemoteDanger } from './lib_room';

export function load_remote_reserve() {
    run_creep(w_role_name.remote_reserve, function (creep) {
        try {
            run_remote_reserve(creep);
        } catch (e) {
            console.log('err run_remote_harvester');
            console.log(e.message);
            console.log(e.stack);
        }
    });
}

function run_remote_reserve(creep: Creep) {
    if (checkRemoteDanger(creep)) {
        return;
    }
    const ch: RemoteReserve = w_cache.get(w_code.REMOTE_KEY_RESERVE);
    const task = ch.getTask(creep);
    if (creep.ticksToLive < 3) {
        // 临死遗言
        ch.forgetTask(creep);
        return;
    }
    if (!task) {
        creep.say('no task');
    }
    const target: Room = Game.rooms[task.remote];

    if (!target) {
        if (task && task.remote) {
            // 没有视野
            let pos = new RoomPosition(25, 25, task.remote);
            creep.moveTo(pos);
        } else {
            creep.say('no_target_' + target?.name);
        }
        return;
    }
    let far = moveToTarget(creep, target.controller as any);

    if (far < 10) {
        creep.reserveController(target.controller);
    }
}
