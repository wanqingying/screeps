import {findDropTarget, pickUpEnergyFromMine, transfer_nearby} from './lib_creep';

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
        let pick = pickEnergyDrop(creep);
        if (!pick) {
            pickUpEnergyFromMine(creep)
        }
    } else {
        creep.say('f');
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
function pickEnergyDrop(creep: Creep, min?: number) {
    let pick_min = min || 20;
    let target: Resource;
    if (creep.memory.target_drop_source_id) {
        // 当前的目标数量大于0则继续
        let t: Resource = Game.getObjectById(creep.memory.target_drop_source_id);
        if (t && t.amount > 0) {
            target = t;
        } else {
            creep.memory.target_drop_source_id = undefined;
        }
    }
    if (!target) {
        let drop = findDropTarget(creep);
        if (drop) {
            drop.cap += creep.store.getCapacity(RESOURCE_ENERGY);
            target = drop.resource;
        }
    }
    if (target && target.amount > pick_min) {
        console.log('gp ');
        creep.memory.target_drop_source_id = target.id;
        const act = creep.pickup(target);

        if (act == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        } else {
            creep.memory.target_drop_source_id = undefined;
        }
        if (act === ERR_FULL) {
            creep.say('full');
        }
    }
    return false;
}

w_roles.carrier = carrier as any;
