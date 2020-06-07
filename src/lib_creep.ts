import { find_nearby_target } from './lib_base';

export function run_creep(creep: Creep) {
    if (creep.memory.renew) {
        renew_creep(creep);
    } else {
        roles[creep.memory.role].setUp(creep);
    }
}

export function transfer_nearby(creep, types?) {
    const filters = [STRUCTURE_CONTAINER, STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER];
    const targets: StructureHasStore = creep.room.find(FIND_STRUCTURES, {
        filter: function (structure: StructureHasStore) {
            if (structure) {
                return false;
            }
            const meet_type = (types || filters).includes(structure.structureType);
            const free = structure.store.getFreeCapacity() > 0;
            return meet_type && free;
        },
    });
    const target: StructureHasStore = creep.find_nearby_target(targets);
    if (target) {
        const act = creep.transfer(target, RESOURCE_ENERGY);
        if (act === ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
        return act;
    } else {
        this.log('transfer target not found');
    }
}

export function renew_creep(creep: Creep) {
    let target: StructureSpawn;
    if (creep.memory.renew_spawn_id) {
        target = Game.getObjectById(creep.memory.renew_spawn_id);
    } else {
        target = find_spawn(creep);
        creep.memory.renew_spawn_id = target.id;
    }
    const act = target.renewCreep(creep);
    if (act === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
    if (act !== OK) {
        creep.log('renew ', get_code_msg_screeps(act));
    }
    return act;
}

export function find_spawn(creep: Creep): StructureSpawn {
    const spawns = creep.room.spawns;
    let target;
    if (spawns.length > 0) {
        // 房间内回复
        target = find_nearby_target(creep, spawns);
    } else {
        // 房间外回复
        const spw = [];
        Object.values(Game.rooms).forEach(room => {
            const sp = room.findBy(FIND_STRUCTURES, c => c.structureType === STRUCTURE_SPAWN);
            spw.push(sp);
        });
        target = find_nearby_target(creep, spw);
    }
    return target as any;
}

// 移动到目标执行操作
// 针对大量单位拥挤的行为做优化
// todo 待优化 实际的操作会延迟一帧
export function moveToTargetDoFn(creep: Creep, target: RoomPosition, fn) {
    if (!target) {
        return;
    }
    creep.moveTo(target);
}

// 捡最大的垃圾
export function pickUpMaxDropEnergy(creep: Creep, min?: number) {
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

function findMaxEnergyStructure(creep: Creep, types?: any[]): AnyStructure {
    let filter_types = types || [STRUCTURE_EXTENSION, STRUCTURE_CONTAINER, STRUCTURE_SPAWN];
    let targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure: StructureContainer) => {
            if (!structure.store) {
                return false;
            }
            let type = structure.structureType;
            let cap = structure.store.getUsedCapacity(RESOURCE_ENERGY);
            return filter_types.includes(type) && cap > 0;
        },
    });
    // 到能量最多的地方补充
    targets = targets.sort((a: StructureExtension, b: StructureExtension) => {
        return a.store.getUsedCapacity(RESOURCE_ENERGY) - b.store.getUsedCapacity(RESOURCE_ENERGY);
    });
    return targets.pop();
}
export function findMaxEnergyWithDraw(creep: Creep, types?: any[]) {
    let target = findMaxEnergyStructure(creep, types);
    if (target) {
        if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
        return true;
    } else {
        return false;
    }
}
