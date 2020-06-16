import { isEmpty, isFull, run_creep, RemoteTransport } from './lib_base';
import { checkRemoteDanger } from './lib_room';
import { TransportDriver } from './mod_role_transport';


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

const DROP = 'drop';

function run_remote_transport(creep: Creep) {
    if (checkRemoteDanger(creep)) {
        creep.say('danger');
        return;
    }

    const sh: RemoteTransport = w_cache.get(w_code.REMOTE_KEY_TRANSPORT);

    if (isFull(creep)) {
        creep.memory.process = DROP;
        sh.forgetTask(creep);
    }

    if (isEmpty(creep)) {
        creep.memory.process = 'p';
    }

    if (creep.memory.process === DROP) {
        let task = sh.getTask(creep);
        // drop
        creep.say('drop');

        let pos = new RoomPosition(25, 25, creep.memory.from);
        if (creep.memory.mv_tick > 0) {
            creep.memory.mv_tick--;
            creep.moveTo(pos);
        }

        if (creep.room.name !== creep.memory.from) {
            creep.moveTo(pos);
            creep.memory.mv_tick = 3;
        } else {
            let container_ids = w_config.rooms[task.from]?.remote_container || [];
            const cns: StructureContainer[] = container_ids
                .map(id => Game.getObjectById(id))
                .filter(c => c) as any;
            const target: StructureContainer = cns.find(c => {
                return c.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            });

            if (target) {
                const code = creep.transfer(target, task.resourceType);
                if (code === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            } else {
                return TransportDriver.give_resource(creep);
            }
        }
    } else {
        // pick
        let task = sh.getTask(creep);
        if (creep.ticksToLive < 3) {
            sh.forgetTask(creep);
        }
        if (!task) {
            creep.say('no task');
            return;
        }
        let target = Game.getObjectById(task.id);

        if (!target) {
            creep.say('no_target_re_get');
            sh.forgetTask(creep);
            target = Game.getObjectById(task.id);
            if (!target) {
                creep.say('no_target');
                return;
            }
        }
        creep.say('pi_k');
        let code;
        if (task.structureType === 'drop') {
            code = creep.pickup(target as any);
        } else {
            code = creep.withdraw(target as any, task.resourceType);
        }
        if (code === OK) {
            sh.updateTask(creep);
        }
        if (code === ERR_NOT_IN_RANGE) {
            creep.moveTo(task.pos);
        }
    }
}

class RemoteTransport2 {}
