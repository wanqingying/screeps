import { moveToTarget } from './lib_creep';
import { RemoteMine, run_creep } from './lib_base';
import {checkRemoteDanger} from "./lib_room";

export function load_remote_harvest() {
    run_creep(w_role_name.remote_harvester, function (creep) {
        try {
            run_remote_harvester(creep);
        } catch (e) {
            console.log('err run_remote_harvester');
            console.log(e.message);
            console.log(e.stack);
        }
    });
}

function run_remote_harvester(creep: Creep) {
    if (checkRemoteDanger(creep)){
        return;
    }
    const ch: RemoteMine = w_cache.get(w_code.REMOTE_KEY_MINE);
    const task = ch.getTask(creep);
    if (creep.ticksToLive<3){
        // 临死遗言
        ch.forgetTask(creep)
        return;
    }
    if (!task) {
        creep.say('no task');
        return;
    }
    const target: Source = Game.getObjectById(task.id);
    let container;
    if (!target) {
        if (task){
            // 没有视野
            let pos=new RoomPosition(25,25,task.remote)
            creep.moveTo(pos)
        }
        return;
    }
    if (task.container_id) {
        container = Game.getObjectById(task.container_id);
    }
    let far: number;
    if (container) {
        far = moveToTarget(creep, container);
    } else {
        far = moveToTarget(creep, target.pos);
    }
    if (far < 10) {
        creep.harvest(target);
    }
}
