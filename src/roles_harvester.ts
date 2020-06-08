import { find_source_min_harvester } from './lib_room';
import { find_nearby_target } from './lib_base';
import { transfer_nearby } from './lib_creep';

const harvester = {} as Role;

harvester.setUp = function (creep) {
    let target: Source;
    // const act2 = try_transfer_drop(creep);
    // if (act2) {
    //     return;
    // }
    creep.drop(RESOURCE_ENERGY);
    if (!creep.memory.target_resource_id) {
        const source = find_source_min_harvester(creep.room);
        target = source.source;
    } else {
        target = Game.getObjectById(creep.memory.target_resource_id);
    }

    if (!target) {
        return creep.log('source not found');
    }
    if (target.energy === 0 && target.ticksToRegeneration > 500) {
        creep.memory.target_resource_id = undefined;
        return creep.say('source empty');
    }
    creep.memory.target_resource_id = target.id;
    const act = creep.harvest(target);
    if (act !== OK) {
        creep.moveTo(target);
    }
    // creep.moveTo(target)
};

roles.harvester = harvester as any;

function try_transfer_drop(creep: Creep) {
    if (creep.store.getFreeCapacity() === 0) {
        // 已装满
        creep.memory.process = 'transfer';
    }
    if (creep.store.getUsedCapacity() === 0) {
        // 已清空
        creep.memory.process = 'dig';
        creep.memory.target_id = undefined;
    }
    if (creep.memory.process === 'transfer') {
        console.log('goto', creep.name, creep.memory.target_id);
        if (creep.memory.target_id) {
            transfer_nearby(creep);
            return true;
        }
        const transfers = creep.room.findBy(
            FIND_STRUCTURES,
            t => t.structureType === STRUCTURE_CONTAINER
        );
        const target = find_nearby_target(creep, transfers);
        if (target) {
            const far = count_distance(creep.pos, (target as any)?.pos || target);
            if (far < 4) {
                transfer_nearby(creep);
                return true;
            } else {
                creep.drop(RESOURCE_ENERGY);
                return false;
            }
        }
    }
}
