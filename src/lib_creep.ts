import {
    findNearTarget,
    isEmpty,
    isNotEmpty,
    isFull,
    getActionLockTarget,
    getCreepBodyNum,
    findByOrder,
    isContainerNearSource,
    findRepairTarget,
} from './lib_base';

// 卸货
export function transferNearby(
    creep: Creep,
    structureTypes?: StructureConstant[],
    resourceType?: ResourceConstant | null
): ScreepsReturnCode {
    resourceType = resourceType || RESOURCE_ENERGY;
    let structureFilters = structureTypes || [
        STRUCTURE_EXTENSION,
        STRUCTURE_SPAWN,
        STRUCTURE_TOWER,
        STRUCTURE_CONTAINER,
        STRUCTURE_STORAGE,
    ];

    let { target, unLock } = getActionLockTarget<StructureContainer>(
        creep,
        'transfer_nearby',
        () => {
            const targets = findByOrder(
                creep.room,
                (s: any) => {
                    if (!s || !s.store) {
                        return false;
                    }
                    if (isContainerNearSource(creep.room, s)) {
                        // 矿源附近的 container 不用于卸货
                        return false;
                    }
                    if (isFull(s, resourceType)) {
                        return false;
                    }
                    return true;
                },
                structureFilters
            );
            return findNearTarget(creep, targets) as any;
        }
    );

    if (!target) {
        unLock();
        return ERR_NOT_FOUND;
    }
    if (isFull(target)) {
        unLock();
        return ERR_NOT_FOUND;
    }
    if (isEmpty(creep)) {
        unLock();
        return ERR_NOT_FOUND;
    }
    // 房间能量未满不存入storage
    if (target.structureType === STRUCTURE_STORAGE) {
        if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
            unLock();
            return ERR_NOT_FOUND;
        }
    }

    const code = creep.transfer(target, resourceType);
    if (code === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
    if (isEmpty(creep)) {
        unLock();
    }
    return code;
}

// 捡最大的垃圾 // 返回捡垃圾是否成功
export function pickUpDropEnergy(creep: Creep): boolean {
    let { target, unLock } = getActionLockTarget(creep, 'pick_up_builder_drop', () => {
        let targets = creep.room.dropResources.filter(d => d.cap < d.resource.amount);
        let target = findNearTarget<any>(
            creep,
            targets.map(t => t.resource)
        );
        if (target) {
            target.cap += creep.store.getFreeCapacity(RESOURCE_ENERGY);
            return target.resource;
        }
    });
    // 垃圾被捡完重新分配
    if (!target || target.amount === 0) {
        unLock();
        return false;
    }
    if (isFull(creep)) {
        unLock();
        return true;
    }
    let code = creep.pickup(target);
    if (code === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
        return true;
    }
    if (code === OK) {
        return true;
    }
    return false;
}
// 从矿区拿资源
export function pickUpFromMine(creep: Creep, type?: ResourceConstant) {
    const h = type || RESOURCE_ENERGY;
    let { target, unLock } = getActionLockTarget<ResourceConstant>(
        creep,
        'pick_drop_or_mine',
        () => {
            let drop = getMineDropNeedPick(creep, h);
            if (drop) {
                return drop;
            } else {
                return getMineContainerNeedWithdraw(creep);
            }
        }
    );
    if (!target) {
        unLock();
        return ERR_NOT_FOUND;
    }
    if ((target as StructureContainer)?.store && isEmpty(target)) {
        unLock();
        return ERR_NOT_FOUND;
    }
    if (typeof (target as Resource)?.amount === 'number' && target?.amount === 0) {
        unLock();
        return ERR_NOT_FOUND;
    }

    let code;
    if (target?.store) {
        code = creep.withdraw(target, h);
    } else {
        code = creep.pickup(target);
    }
    if (code === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
    if (code === OK) {
        unLock();
    }
    return code;
}

export function getMineDropNeedPick(creep: Creep, type?: ResourceConstant) {
    let drops = Array.from(creep.room.dropResources).filter(a => {
        return a.cap < a.resource?.amount && a.resource?.amount;
    });
    let drop = findNearTarget<Resource>(
        creep,
        drops.map(d => d.resource)
    );
    if (drop) {
        drops.forEach(d => {
            if (d.resource.id === drop.id) {
                d.cap += creep.store.getFreeCapacity(type);
            }
        });
        return drop;
    }
}
export function getMineContainerNeedWithdraw(creep: Creep, type?: ResourceConstant) {
    let sources = creep.room.sourceInfo;
    for (let sh of sources) {
        if (isMineContainerNeedWithdraw(sh)) {
            sh.containerCap = sh.containerCap - creep.store.getFreeCapacity(type);
            return sh.container;
        }
    }
}
export function isMineContainerNeedWithdraw(sh: SourceCache, type?: ResourceConstant) {
    return (
        sh.container &&
        isNotEmpty(sh.container) &&
        sh.containerCap < sh.container.store.getUsedCapacity(type)
    );
}

// upgrader获取能量
export function getEnergyUpgrader(creep: Creep, types?: any[]) {
    let { target, unLock } = getActionLockTarget(creep, 'get_energy_up', () => {
        let filter_types = types || [STRUCTURE_CONTAINER, STRUCTURE_STORAGE];
        let targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure: StructureContainer) => {
                if (!filter_types.includes(structure?.structureType)) {
                    return false;
                }
                if (isEmpty(structure)) {
                    return false;
                }
                return true;
            },
        });
        return findNearTarget(creep, targets);
    });
    if (!target) {
        unLock();
        return ERR_NOT_FOUND;
    }

    moveToTarget(creep, target);
    return creep.withdraw(target, RESOURCE_ENERGY);
}

export function harvestSource(creep: Creep): ScreepsReturnCode {
    const { target, unLock } = getActionLockTarget(creep, 'harvest_source', () => {
        let sourceH = creep.room.sourceInfo.sort((a, b) => {
            return a.speed - b.speed;
        });
        let t = Array.from(sourceH).shift();
        if (t) {
            t.speed += getCreepBodyNum(creep, WORK);
        }
        return t?.source;
    });

    if (!target) {
        unLock();
        return ERR_NOT_FOUND;
    }

    if (target.energy === 0 && target.ticksToRegeneration > 500) {
        // 资源采尽时切换目标
        unLock();
        return ERR_NOT_FOUND;
    }

    findAndMoveToSourcePos(creep, target);
    return creep.harvest(target);
}

function findAndMoveToSourcePos(creep: Creep, target) {
    let sh = creep.room.sourceInfo.find(t => t.source.id === target.id);
    if (!sh?.container) {
        return moveToTarget(creep, target);
    } else {
        return moveToTarget(creep, sh.container.pos);
    }
}

export function moveToTarget(creep: Creep, target: RoomPosition, dis?: number) {
    const far = w_utils.count_distance(creep.pos, target);
    if (far > (dis || 0)) {
        creep.moveTo(target);
    }
    return far;
}

export function checkRepair(creep: Creep, include?: any[], exclude?: any[]): ScreepsReturnCode {
    const { target, unLock } = getActionLockTarget(creep, 'check_repair_creep', () => {
        return findRepairTarget(creep.room, include, exclude);
    });

    if (!target) {
        return ERR_NOT_FOUND;
    }
    moveToTarget(creep, target);
    let act = creep.repair(target);
    if (isEmpty(creep)) {
        unLock();
    }
    return act;
}

export function isCreepStop(creep: Creep) {
    if (creep.spawning){
        return true
    }
    if (creep.memory.target_room && creep.memory.target_room !== creep.room.name) {
        return true;
    }
    return false;
}
