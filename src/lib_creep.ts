import {
    find_nearby_target,
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

export function transfer_nearby(
    creep: Creep,
    types?: StructureConstant[],
    resourceType?: ResourceConstant | null
): ScreepsReturnCode {
    resourceType = resourceType || RESOURCE_ENERGY;
    let filters = [
        STRUCTURE_SPAWN,
        STRUCTURE_EXTENSION,
        STRUCTURE_TOWER,
        STRUCTURE_CONTAINER,
        // STRUCTURE_STORAGE,
    ];

    let { target, unLock } = getActionLockTarget<StructureContainer>(
        creep,
        'transfer_nearby',
        () => {
            const targets = findByOrder(
                creep,
                (s: StructureContainer) => {
                    if (!s || !s.store) {
                        return false;
                    }
                    if (isTargetNearSource(creep.room, s)) {
                        return false;
                    }
                    return isNotFull(s, resourceType);
                },
                types || filters
            );
            return find_nearby_target(creep, targets) as any;
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

// 捡最大的垃圾 // 返回捡垃圾是否成功
export function pickUpDropEnergy(creep: Creep): boolean {
    let { target, unLock } = getActionLockTarget(creep, 'pick_up_builder_drop', () => {
        let targets = creep.room.dropResources.filter(d => d.cap < d.resource.amount);
        let target = find_nearby_target<any>(
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

// 捡垃圾
export function pickEnergyDrop(creep: Creep, min?: number): boolean {
    let { target, unLock } = getActionLockTarget<ResourceConstant>(creep, 'pick_drop', () => {
        let drop = findDropTargetSync(creep);
        if (drop) {
            drop.cap += creep.store.getFreeCapacity(RESOURCE_ENERGY);
        }
        return drop?.resource;
    });

    if (!target || target.amount === 0) {
        unLock();
        return false;
    }
    let code = creep.pickup(target);
    if (code === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
        return true;
    }
    return false;
}
export function pickUpEnergyFromMine2(creep: Creep, type?: ResourceConstant): ScreepsReturnCode {
    const sources = creep.room.sourceInfo;
    const h = type || RESOURCE_ENERGY;

    let { target, unLock } = getActionLockTarget(creep, 'pick_up_mine', () => {
        for (let sh of sources) {
            if (sh.container && isNotEmpty(sh.container) && sh.containerCap > 0) {
                sh.containerCap = sh.containerCap - creep.store.getFreeCapacity(type);
                return sh.container;
            }
        }
    });

    if (!target || isEmpty(target)) {
        unLock();
        return ERR_NOT_FOUND;
    }
    if (isEmpty(creep)) {
        // unLock();
        // return
    }
    const code = creep.withdraw(target, h);
    if (code === ERR_NOT_IN_RANGE) {
        creep.moveTo(target.pos);
    }
    return code;
}
// 从矿区拿资源
export function pickUpDropOrFromMineContainer(creep: Creep, type?: ResourceConstant) {
    const sources = creep.room.sourceInfo;
    const h = type || RESOURCE_ENERGY;

    let { target, unLock } = getActionLockTarget<ResourceConstant>(
        creep,
        'pick_drop_or_mine',
        () => {
            let drops = Array.from(creep.room.dropResources).filter(
                a => a?.cap > 0 && a?.resource?.amount
            );
            let drop = find_nearby_target<DropResource>(creep, drops);
            if (drop) {
                drop.cap += creep.store.getFreeCapacity(h);
                return drop.resource;
            } else {
                for (let sh of sources) {
                    if (sh.container && isNotEmpty(sh.container) && sh.containerCap > 0) {
                        sh.containerCap = sh.containerCap - creep.store.getFreeCapacity(h);
                        return sh.container;
                    }
                }
            }
        }
    );

    if (!target) {
        unLock();
        return ERR_NOT_FOUND;
    }
    {
        let g = target as StructureContainer;
        if (g?.store && isEmpty(g)) {
            unLock();
            return ERR_NOT_FOUND;
        }
    }
    {
        let g = target as Resource;
        if (typeof g?.amount === 'number' && g?.amount === 0) {
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
    return code;
}
// 拿资源 垃圾或者建筑,builder,upgrader 等
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
            let drops = Array.from(creep.room.dropResources).filter(
                a => a?.cap > 0 && a?.resource?.amount
            );
            let drop = find_nearby_target<DropResource>(creep, drops);
            if (drop) {
                drop.cap += creep.store.getFreeCapacity(h);
                return drop.resource;
            } else {
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
                return find_nearby_target(creep, targets);
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
        return find_nearby_target(creep, targets);
    });
    if (!target) {
        unLock();
        return ERR_NOT_FOUND;
    }

    moveToTarget(creep, target);
    return creep.withdraw(target, RESOURCE_ENERGY);
}

// 找到垃圾
export function findDropTargetSync(creep: Creep): DropResource {
    let room = creep.room;
    let targets = room.dropResources;
    return Array.from(targets)
        .sort((a, b) => {
            let ea = a.resource?.amount - a.cap;
            let eb = b.resource?.amount - b.cap;
            return ea - eb;
        })
        .filter(b => b && b?.resource?.amount)
        .pop();
}
export function pickUpEnergyFromMine(creep: Creep, type?: ResourceConstant): ScreepsReturnCode {
    const sources = creep.room.sourceInfo;
    const h = type || RESOURCE_ENERGY;

    let { target, unLock } = getActionLockTarget(creep, 'pick_up_mine', () => {
        for (let sh of sources) {
            if (sh.container && isNotEmpty(sh.container) && sh.containerCap > 0) {
                sh.containerCap = sh.containerCap - creep.store.getFreeCapacity(type);
                return sh.container;
            }
        }
    });

    if (!target || isEmpty(target)) {
        unLock();
        return ERR_NOT_FOUND;
    }
    if (isEmpty(creep)) {
        // unLock();
        // return
    }
    const code = creep.withdraw(target, h);
    if (code === ERR_NOT_IN_RANGE) {
        creep.moveTo(target.pos);
    }
    return code;
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

        const spawn = find_nearby_target<StructureSpawn>(
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
    let target;
    let key = 'source_id';
    let cacheKey = creep.memory[key];

    if (cacheKey) {
        target = Game.getObjectById(cacheKey);
    } else {
        let t = findSource(creep);
        if (t?.container) {
            creep.drop(RESOURCE_ENERGY);
        }
        target = t?.source;
        creep.memory[key] = target?.id;
    }
    creep.log_one('find');

    if (!target) {
        creep.log_one('not find');
        creep.memory[key] = undefined;
        return ERR_NOT_FOUND;
    }
    if (target.energy === 0 && target.ticksToRegeneration > 500) {
        creep.log_one('source empty');
        // 能量耗尽时切换目标
        creep.memory[key] = undefined;
        creep.say('source empty see another');
        return ERR_NOT_FOUND;
    }
    findAndMoveToSourcePos(creep, target);
    return harvestSourceSync(creep, target);
}

function harvestSourceSync(creep: Creep, target: Source) {
    let sh = creep.room.sourceInfo.find(s => s.source.id === target.id);
    if (sh) {
        sh.speed += getCreepBodyNum(creep, WORK);
    }
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

function findSource(creep: Creep) {
    let sourceH = creep.room.sourceInfo.sort((a, b) => {
        return a.speed - b.speed;
    });
    return Array.from(sourceH).shift();
}
export function moveToTarget(creep: Creep, target: RoomPosition, dis?: number) {
    const far = w_utils.count_distance(creep.pos, target);
    if (far > (dis || 0)) {
        return creep.moveTo(target);
    }
    return OK;
}

export function getLockId(creep: Creep, index: number) {
    let cache = getCache(creep);
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

export function getLockKey(creep: Creep) {
    let che = getCache(creep);
    che.lockSeed++;
    return `${creep.name}_${che.lockSeed}`;
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
    return creep.repair(target);
}
