import { isEmpty, isFull, RemoteTransport, run_creep } from './lib_base';
import { spawnCreep } from './mod_spawn_creep';
import { moveToTarget } from './lib_creep';
import { checkRemoteDanger, findAttackTarget } from './lib_room';
import { give_resource } from './mod_role_distribution';

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
    if (checkRemoteDanger(creep)) {
        creep.say('danger');
        return;
    }

    const sh: RemoteTransport = w_cache.get(w_code.REMOTE_KEY_TRANSPORT);
    creep.say('hi')
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
                return give_resource(creep);
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
        creep.say('pick');
        let target = Game.getObjectById(task.id);

        if (!target) {
            if (!task || !task.remote) {
                sh.forgetTask(creep);
                task = sh.getTask(creep);
            } else {
                // 没有视野 移动到目标
                let pos = new RoomPosition(25, 25, task.remote);
                let far = moveToTarget(creep, pos);
                if (far < 10) {
                    // 有视野还找不到 可能是刷没了 重置
                    sh.forgetTask(creep);
                } else {
                    return;
                }
            }
        }

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
