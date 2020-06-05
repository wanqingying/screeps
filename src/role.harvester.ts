export const harvester = {

    /** @param {Creep} creep **/
    run: function(creep:Creep) {
        // 空间未装满继续挖矿
        if(creep.store.getFreeCapacity() > 0) {
            const sources = creep.room.find(FIND_SOURCES);
            let source=sources[0];
            let s=Game.getObjectById(source.id)

            // source.id
            // 锁定矿源防止来回跑
            Memory.creeps[creep.name].target_resource_id=source.id
            if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else {
            const targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
};
