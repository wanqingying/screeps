import {
    findNearTarget,
    isEmpty,
    isNotEmpty,
    isFull,
    getActionLockTarget,
    getCreepBodyNum,
    findByOrder,
    isNotFull,
    isTargetNearSource,
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
                    if (isTargetNearSource(creep.room, s)) {
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

export function find_spawn(creep: Creep): StructureSpawn {
    const spawns = creep.room.spawns;
    let target;
    if (spawns.length > 0) {
        // 房间内回复
        target = findNearTarget(creep, spawns);
    } else {
        // 房间外回复
        const spw = [];
        Object.values(Game.rooms).forEach(room => {
            const sp = room.findBy(FIND_STRUCTURES, c => c.structureType === STRUCTURE_SPAWN);
            spw.push(sp);
        });
        target = findNearTarget(creep, spw);
    }
    return target as any;
}

// 捡最大的垃圾 // 返回捡垃圾是否成功
export function pickUpDropEnergy(creep: Creep): boolean {
    let { target, unLock } = getActionLockTarget(creep, 'pick_up_builder_drop', () => {
        let targets = creep.room.dropResources.filter(d => d.cap < d.resource.amount);
        let target = findNearTarget<any>(
            creep,
            targets.map(t => t.resource)
        );
        console.log('find_near_by', target?.resource?.pos);
        console.log('count ', targets.length);
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
    const sources = creep.room.sourceInfo;
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
    {
        let container = target as StructureContainer;
        if (container?.store && isEmpty(container)) {
            unLock();
            return ERR_NOT_FOUND;
        }
    }
    {
        let dropResource = target as Resource;
        if (typeof dropResource?.amount === 'number' && dropResource?.amount === 0) {
            unLock();
            return ERR_NOT_FOUND;
        }
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

// 拿资源 builder,upgrader 等,优先建筑
export function pickUpDropOrFromStructure(
    creep: Creep,
    structures?: StructureConstant[],
    type?: ResourceConstant
) {
    const h = type || RESOURCE_ENERGY;
    let structureFilters = structures || [STRUCTURE_STORAGE, STRUCTURE_CONTAINER];

    let { target, unLock } = getActionLockTarget<ResourceConstant>(
        creep,
        'pick_drop_or_mine',
        () => {
            let targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure: StructureContainer) => {
                    if (!structure.store) {
                        return false;
                    }
                    if (!structureFilters.includes(structure?.structureType)) {
                        return false;
                    }
                    if (structure.store && isEmpty(structure)) {
                        return false;
                    }
                    return true;
                },
            });
            let m = findNearTarget(creep, targets);
            if (m) {
                return m;
            }

            let drops = Array.from(creep.room.dropResources).filter(a => {
                return a?.cap < a.resource.amount && a?.resource?.amount;
            });
            let drop = findNearTarget<Resource>(
                creep,
                drops.map(d => d.resource)
            );
            if (drop) {
                drops.forEach(d => {
                    if (d.resource.id === drop.id) {
                        d.cap += creep.store.getFreeCapacity(h);
                    }
                });
                return drop;
            }
        }
    );

    if (!target) {
        unLock();
        return ERR_NOT_FOUND;
    }
    {
        let g = target as StructureContainer;
        if (g.store && isEmpty(g)) {
            unLock();
            return;
        }
    }
    {
        let g = target as Resource;
        if (g?.amount === 0) {
            unLock();
            return;
        }
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
        return;
    }
    return code;
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

export function renewCreep(creep: Creep) {
    let target: StructureSpawn;
    if (creep.memory.renew_spawn_id) {
        target = Game.getObjectById(creep.memory.renew_spawn_id as Id<StructureSpawn>);
    } else {
        target = find_spawn(creep);
        creep.memory.renew_spawn_id = target.id;
    }
    if (!target.renewCreep) {
        creep.log('renew err ', target);
        return;
    }
    const act = target.renewCreep(creep);
    if (act === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
    }
    if (act === OK) {
        creep.resetRenewFailTime();
    }
    if (act === ERR_NOT_ENOUGH_ENERGY) {
        creep.increaseRenewFailTime();
    }
    return act;
}
export function checkRenewCreep(creep: Creep) {
    // 能量回复策略
    const life = creep.ticksToLive;
    if (creep.memory?.renew) {
        // 正常回到 1450
        if (creep.ticksToLive >= 1450) {
            return stop_renew(creep);
        }
        // 缺能量时只需要回到400
        if (creep.ticksToLive >= 400 && creep.room.energyLack) {
            return stop_renew(creep);
        }
        if (creep.getRenewFailTime() > 15) {
            return stop_renew(creep);
        }
        if (creep.room.spawning) {
            // return stop_renew(creep);
        }
        return renewCreep(creep);
    } else {
        // 大于 250 tick 不考虑
        let rt_a = life >= 250;
        // 两次间隔 200 tick
        let rt_b = Game.time - creep.memory.renew_tick < 200;
        // 缺能量不考虑
        let rt_c = creep.room.energyLack;
        // 同时回能量人数不能超过上限
        let rt_d = creep.room.memory.renew_count > 3;
        if ([rt_a, rt_b, rt_d].some(rt => rt)) {
            return;
        }

        const spawn = findNearTarget<StructureSpawn>(
            creep,
            creep.room.spawns.map(a => a.pos)
        );
        if (!spawn) {
            return;
        }
        const far = w_utils.count_distance(spawn.pos, creep.pos);
        const danger = far + (250 - life) / 10;
        if (danger > 25) {
            start_renew(creep);
        }
    }
}

function stop_renew(creep: Creep) {
    creep.memory.renew_tick = Game.time;
    creep.memory.renew = false;
    creep.room.memory.renew_count--;
    creep.memory.renew_spawn_id = undefined;
    creep.resetRenewFailTime();
}
function start_renew(creep: Creep) {
    creep.memory.renew = true;
    creep.room.memory.renew_count++;
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
        return creep.moveTo(target);
    }
    return OK;
}

export function getCache(creep: Creep) {
    let che: CacheCreep = w_creeps.get(creep.name);
    if (!che) {
        che = { renewTime: 0, lockSeed: 0, tick: 0 };
        w_creeps.set(creep.name, che);
    }
    if (typeof che.renewTime !== 'number') {
        che.renewTime = 0;
        w_creeps.set(creep.name, che);
    }
    if (typeof che.lockSeed !== 'number') {
        che.lockSeed = 0;
        w_creeps.set(creep.name, che);
    }
    if (typeof che.tick !== 'number') {
        che.tick = 0;
        w_creeps.set(creep.name, che);
    }
    return che;
}

export function checkRepair(creep: Creep, include?: any, exclude?: any): ScreepsReturnCode {
    let target;
    let key = 'key_repair';
    let cacheKey = creep.memory[key];

    if (cacheKey) {
        let k = w_cache.get(cacheKey + creep.name + target?.id);
        w_cache.set(cacheKey + creep.name + target?.id, k + 1 || 0);
        if (k > 50) {
            w_cache.set(cacheKey + creep.name + target?.id, 0);
            creep.memory[key] = undefined;

            target = null;
        } else {
            target = Game.getObjectById(cacheKey);
        }
    } else {
        target = findRepairTarget(creep.room, include, exclude);
        w_cache.set(cacheKey + creep.name + target?.id, 0);
        creep.memory[key] = target?.id;
    }

    if (!target) {
        creep.memory[key] = undefined;

        return ERR_NOT_FOUND;
    }
    moveToTarget(creep, target);
    let act = creep.repair(target);
    if (isEmpty(creep)) {
        creep.memory[key] = undefined;
    }
    return act;
}
