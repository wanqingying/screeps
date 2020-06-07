import { transfer_nearby } from './lib_creep';

const carrier = {} as Role;

carrier.setUp = function (creep) {
    if (creep.store.getUsedCapacity() === 0) {
        creep.memory.process = 'pick';
        creep.memory.target_id = undefined;
    }
    if (creep.store.getFreeCapacity() === 0) {
        creep.memory.process = 'drop';
    }
    if (creep.memory.process === 'pick') {
        pickUpMaxDropEnergy(creep);
    } else {
        const act = transfer_nearby(creep, [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION]);
        if (act === ERR_TARGET_NOT_FOUND) {
            transfer_nearby(creep, [
                STRUCTURE_SPAWN,
                STRUCTURE_TOWER,
                STRUCTURE_EXTENSION,
                STRUCTURE_CONTAINER,
            ]);
        }
    }
};

// 捡最大的垃圾
function pickUpMaxDropEnergy(creep: Creep, min?: number) {
    let pick_min = min || 0;
    // 如果捡垃圾的目标已经有多个人去捡，重新分配
    let target_id = creep.memory.target_drop_source_id;
    // let exist_id = Object.values(Game.creeps).map(c => c.memory.target_drop_source_id);
    // if (exist_id.filter(d => d === target_id).length > 1) {
    //     creep.memory.target_drop_source_id = undefined;
    // }
    // 垃圾被捡完重新分配
    if (target_id) {
        let gbg: Resource = Game.getObjectById(creep.memory.target_drop_source_id);
        if (!gbg || gbg.amount < 10) {
            creep.memory.target_drop_source_id = undefined;
        }
    }

    let target: Resource;
    if (creep.memory.target_drop_source_id) {
        target = Game.getObjectById(creep.memory.target_drop_source_id);
    } else {
        let room = creep.room;
        let targets = room.find(FIND_DROPPED_RESOURCES);
        target = targets
            .sort((a, b) => {
                return a.amount - b.amount;
            })
            .pop();
    }
    if (target && target.amount > pick_min) {
        if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        } else {
            creep.memory.target_drop_source_id = undefined;
        }
        return true;
    } else {
        return false;
    }
}

roles.carrier = carrier as any;
