import { config } from './boostrap.config';
import { log } from './utils.uta';

export const harvester = {
    /** @param {Creep} creep **/
    run: function (creep: Creep) {
        // 根据配置分配矿工
        if (creep.store.getFreeCapacity() > 0) {
            let targetId;
            if (creep.memory.target_resource_id) {
                targetId = creep.memory.target_resource_id;
            } else {
                targetId = Object.keys(Memory.resource_energy).find((id, i) => {
                    let nums = config.rooms.W2N8.resource_energy_nums[i];
                    return Memory.resource_energy[id].miners.length < nums;
                });
                if (targetId) {
                    Memory.resource_energy[targetId].miners.push(creep.name);
                    creep.memory.target_resource_id = targetId;
                }
            }
            if (targetId) {
                let source = Game.getObjectById<Source>(targetId);
                if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, config.path_config_mine);
                }
            } else {
                log('creep no mine', creep.name);
            }
        } else {
            const targets = creep.room.find(FIND_STRUCTURES, {
                filter: structure => {
                    return (
                        (structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                },
            });
            if (targets.length > 0) {
                if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
    },
};
