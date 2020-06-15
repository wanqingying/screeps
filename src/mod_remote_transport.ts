import { isEmpty, isFull, RemoteResource } from './lib_base';
import { spawnCreep } from './mod_spawn_creep';

export function load_remote_transport() {
    const cps = Object.values(Game.creeps).filter(c => c.memory.role === w_role_name.remote_carry);
    Object.values(Game.rooms).forEach(room => {
        if (!room.controller?.my) {
            return;
        }
        let che: CacheGlobalRoom = w_cache.get(room.name);
        if (!Array.isArray(che.remotes) || che.remotes.length === 0) {
            return;
        }
        const creeps = cps.filter(c => c.memory.from === room.name);
        const th: RemoteResource = w_cache.get(w_code.REMOTE_KEY_A);
        const tasks = th.getRoomTask(room);

        if (creeps.length < che.remotes.length && tasks.length > 0) {
            spawnCreep(room, w_role_name.remote_carry, { from: room.name });
        }
        creeps.forEach(creep => {
            run_remote_transport(creep);
        });
    });
}

function run_remote_transport(creep: Creep) {
    const sh: RemoteResource = w_cache.get(w_code.REMOTE_KEY_A);

    if (isFull(creep)) {
        creep.memory.process = 'd';
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
