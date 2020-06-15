import { isEmpty, isFull, RemoteTransport, run_creep } from './lib_base';
import { spawnCreep } from './mod_spawn_creep';
import {moveToTarget} from "./lib_creep";

export function load_remote_transport() {
    run_creep(w_role_name.remote_carry, function (creep) {
        try {
            run_remote_transport(creep);
        } catch (e) {
            console.log('err run_remote_transport ');
            console.log(e.message);
            console.log(e.stack);
        }
    });
}

function run_remote_transport(creep: Creep) {
    const sh: RemoteTransport = w_cache.get(w_code.REMOTE_KEY_TRANSPORT);

    if (isFull(creep)) {
        creep.memory.process = 'd';
        sh.forgetTask(creep);
    }
    if (isEmpty(creep)) {
        creep.memory.process = 'p';
    }

    if (creep.memory.process === 'd') {
        let task = sh.getTask(creep);
        // drop
        creep.say('drop');
        let container_ids = w_config.rooms[task.from].remote_container;
        const cns: StructureContainer[] = container_ids
            .map(id => Game.getObjectById(id))
            .filter(c => c) as any;
        const target: StructureContainer = cns.find(c => {
            return c.store.getFreeCapacity() > 0;
        });
        if (target) {
            const code = creep.transfer(target, task.resourceType);
            if (code === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        }
    } else {
        // pick
        let task = sh.getTask(creep);
        if (!task) {
            creep.say('no task');
            return;
        }
        creep.say('pick');
        let target = Game.getObjectById(task.id);

        if (!target) {
            // 没有视野
            let pos=new RoomPosition(25, 25, task.remote);
            let far=moveToTarget(creep,pos)
            if (far<10){
                // 有视野还找不到 可能是刷没了 重置
                sh.forgetTask(creep)
            }else {
                return;
            }
        }

        let code;

        if (task.structureType === 'drop') {
            code = creep.pickup(target as any);
        } else {
            code = creep.withdraw(target as any, task.resourceType);
        }

        if (code === ERR_NOT_IN_RANGE) {
            creep.moveTo(task.pos);
        }
    }
}
