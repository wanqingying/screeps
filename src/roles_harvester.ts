import { find_source_min_harvester } from './lib_room';

const harvester = {} as Role;

harvester.setUp = function (creep) {
    let target: Source;
    if (!creep.memory.target_resource_id) {
        const source = find_source_min_harvester(creep.room);
        target = source.target;
    } else {
        target = Game.getObjectById(creep.memory.target_resource_id);
    }

    if (!target) {
        return creep.log('source not found');
    }
    if (target.energy === 0 && target.ticksToRegeneration > 500) {
        creep.memory.target_resource_id = undefined;
        return creep.log('source empty');
    }
    creep.memory.target_resource_id=target.id;
    const act=creep.harvest(target);
    if (act===ERR_NOT_IN_RANGE){
        creep.moveTo(target)
    }
};

roles.harvester = harvester as any;
