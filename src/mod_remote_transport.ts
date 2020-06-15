import { isEmpty, isFull, RemoteTransport, run_creep } from './lib_base';
import { spawnCreep } from './mod_spawn_creep';

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
    }
    if (isEmpty(creep)) {
        creep.memory.process = 'p';
    }

    if (creep.memory.process === 'd') {
        let task = sh.getTask(creep);
        // drop
        let container_ids = w_config.rooms[creep.memory.from].remote_container;
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
        let target = Game.getObjectById(task.id);
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
