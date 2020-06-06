import { config } from './config';
import { getDistance, log } from './utils.uta';

function run_builder(creep: Creep) {
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
            log('build not found:', creep.name);
            creep.memory.target_id = undefined;
        }
    } else {
        if (pickUpMaxDropEnergy(creep, creep.store.getFreeCapacity() / 2)) {
            return;
        }
        findMaxEnergyWithDraw(creep);
    }
}

function run_harvester(creep: Creep) {
    // 根据配置分配矿工
    function clear_resource_id(creep: Creep, id: string) {
        creep.memory.target_resource_id = undefined;
        let miners = Memory.resource_energy[id].miners;
        Memory.resource_energy[id].miners = miners.filter(m => m !== creep.name);
    }
    creep.drop(RESOURCE_ENERGY);
    let targetId;
    if (creep.memory.target_resource_id) {
        targetId = creep.memory.target_resource_id;
        // let tg = Game.getObjectById<Source>(targetId);
        // if (tg.energy === 0 && tg.ticksToRegeneration > 60) {
        //     clear_resource_id(creep, targetId);
        //     targetId = undefined;
        // }
    }
    if (!targetId) {
        targetId = Object.keys(Memory.resource_energy).find((id, i) => {
            let nums = config.rooms[config.room_name_1].resource_energy_nums[i];
            let a = Memory.resource_energy[id].miners.length < nums;
            let b = Game.getObjectById<Source>(id);
            return a && b && b.energy > 400;
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
        } else {
            // clear_resource_id(creep, targetId);
        }
    } else {
        log('creep no mine', creep.name);
    }
}
function run_worker(creep: Creep) {
    // 根据配置分配矿工
    run_harvester(creep);
}

function run_starter(creep: Creep) {
    if (creep.store.getFreeCapacity() > 0 && creep.memory.process !== 'drop') {
        let target = Object.keys(Memory.resource_energy)
            .filter(k => {
                let g: Source = Game.getObjectById(k);
                return g && g.energy > 500;
            })
            .pop();
        if (target) {
            let g: Source = Game.getObjectById(target);
            if (creep.harvest(g) === ERR_NOT_IN_RANGE) {
                creep.moveTo(g);
            }
        }
    } else {
        creep.memory.process = 'drop';
        if (transferNearby(creep)) {
            if (creep.store.getUsedCapacity() === 0) {
                creep.memory.process = 'dig';
            }
        }
    }
}
function run_upgrader(creep: Creep) {
    if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
        creep.memory.upgrading = false;
        creep.say('find energy');
    }
    if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
        creep.memory.upgrading = true;
        creep.say('upgrade');
    }
    if (creep.memory.upgrading) {
        let fn = () => creep.upgradeController(creep.room.controller);
        moveToTargetDoFn(creep, creep.room.controller.pos, fn);
    } else {
        // if (pickUpMaxDropEnergy(creep, creep.store.getFreeCapacity())) {
        //     return;
        // }
        findMaxEnergyWithDraw(creep, [STRUCTURE_CONTAINER]);
    }
}
function run_carry(creep: Creep) {
    if (creep.store.getUsedCapacity() === 0) {
        pickUpMaxDropEnergy(creep);
    } else {
        transferNearby(creep, [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION]);
    }
}
function run_container_carry(creep: Creep) {
    if (creep.store.getFreeCapacity() > creep.store.getCapacity() / 5) {
        pickUpMaxDropEnergy(creep);
    } else {
        transferNearby(creep, [STRUCTURE_CONTAINER]);
    }
}
function run_heal(creep: Creep) {
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) < 10) {
        return findMaxEnergyWithDraw(creep);
    }
    const creeps = Object.values(Game.creeps).sort((a, b) => {
        return a.ticksToLive - b.ticksToLive;
    });
    const tg = creeps.shift();
    if (creep.heal(tg) === ERR_NOT_IN_RANGE) {
        creep.say('🔄 heal');
        creep.moveTo(tg);
    }
}

function findMaxEnergyWithDraw(creep: Creep, types?: any[]) {
    let target = findMaxEnergyStructure(creep, types);
    if (target) {
        if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, config.path_config_mine);
        }
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
        let room = Game.rooms[config.rooms[config.room_name_1].name];
        let targets = room.find(FIND_DROPPED_RESOURCES);
        target = targets
            .sort((a, b) => {
                return a.amount - b.amount;
            })
            .pop();
    }
    if (target && target.amount > pick_min) {
        if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, config.path_config_mine);
        } else {
            creep.memory.target_drop_source_id = undefined;
        }
        return true;
    } else {
        return false;
    }
}

function transferNearby(creep: Creep, filters?: any[]) {
    let filter_cc = filters || [
        STRUCTURE_CONTAINER,
        STRUCTURE_EXTENSION,
        STRUCTURE_SPAWN,
        STRUCTURE_TOWER,
    ];
    let targets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure: StructureContainer) => {
            if (!structure.store) {
                return false;
            }
            let type = structure.structureType;
            let cp = structure?.store?.getFreeCapacity(RESOURCE_ENERGY);
            return filter_cc.includes(type) && cp > 0;
        },
    });
    let pos = creep.pos;

    targets = targets.sort((a, b) => {
        let dxa = pos.x - a.pos.x;
        let dya = pos.y - a.pos.y;
        let dxb = pos.x - b.pos.x;
        let dyb = pos.y - b.pos.y;
        return dxa * dxa + dya * dya - (dxb * dxb + dyb * dyb);
    });
    let target = targets.shift();
    if (target) {
        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            return false;
        } else {
            creep.memory.target_drop_source_id = undefined;
            return true;
        }
    }
    return false;
}

// 移动到目标执行操作
// 针对大量单位拥挤的行为做优化
// todo 待优化 实际的操作会延迟一帧
function moveToTargetDoFn(creep: Creep, target: RoomPosition, fn) {
    if (!target) {
        return;
    }
    let act_msg = fn();
    creep.moveTo(target);
    // let dis = getDistance(creep.pos, target);
    // if (creep.memory.distance_1 !== creep.memory.distance_2) {
    //     creep.moveTo(target);
    // } else if (creep.memory.act_msg === ERR_NOT_IN_RANGE) {
    //     creep.moveTo(target);
    //     creep.memory.act_msg = fn();
    // } else {
    //     creep.memory.act_msg = fn();
    //     console.log('act', creep.memory.act_msg);
    // }
    // creep.memory.distance_2 = creep.memory.distance_1;
    // creep.memory.distance_1 = dis;
}

export const role_runner = {
    starter: run_starter,
    harvester: run_harvester,
    worker: run_worker,
    upgrader: run_upgrader,
    builder: run_builder,
    carry: run_carry,
    heal: run_heal,
    container_carry: run_container_carry,
};
