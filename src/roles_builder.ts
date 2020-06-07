import { moveToTargetDoFn,pickUpMaxDropEnergy ,findMaxEnergyWithDraw} from './lib_creep';


const builder = {} as Role;

builder.setUp = function (creep) {
    if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
        creep.memory.building = false;
        creep.memory.target_id = undefined;
        creep.say('store');
    }
    if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
        creep.memory.building = true;
        creep.say('build');
    }

    if (creep.memory.building) {
        let tag;
        if (creep.memory.target_id) {
            tag = Game.getObjectById(creep.memory.target_id);
        } else {
            let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            targets = targets.sort((a, b) => {
                return a.progress - b.progress;
            });
            if (targets.length) {
                tag = targets.pop();
                creep.memory.target_id = tag.id;
            }
        }
        if (tag) {
            const bd = () => creep.build(tag);
            moveToTargetDoFn(creep, tag.pos || tag, bd);
        } else {
            creep.log('build not found');
            creep.memory.target_id = undefined;
        }
    } else {
        if (pickUpMaxDropEnergy(creep, creep.store.getFreeCapacity() / 2)) {
            return;
        }
        findMaxEnergyWithDraw(creep);
    }
};

roles.builder = builder as any;
