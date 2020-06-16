import { moveToTarget } from './lib_creep';
import { RemoteAttack, RemoteMine, run_creep, run_my_room } from './lib_base';
import { checkRemoteDanger } from './lib_room';
import { spawnCreep } from './mod_spawn_creep';

export function load_remote_attack() {
    const ch: RemoteAttack = w_cache.get(w_code.REMOTE_KEY_ATTACK);
    run_my_room(function (room) {
        let spawn = ch.shouldSpawnAttack(room);
        if (spawn && spawn.target && spawn.target.ticksToLive > 100) {
            return spawnCreep(room, w_role_name.remote_attack, { remote: spawn.remote });
        }
    });

    run_creep(w_role_name.remote_attack, function (creep) {
        try {
            run_remote_attack(creep);
        } catch (e) {
            console.log('err run_remote_harvester');
            console.log(e.message);
            console.log(e.stack);
        }
    });
}

function run_remote_attack(creep: Creep) {
    let ch: RemoteAttack = w_cache.get(w_code.REMOTE_KEY_ATTACK);
    let task = ch.getTask(creep);
    if (task && task.target) {
        let code = creep.attack(task.target);
        moveToTarget(creep, task.target as any);
    }
}
