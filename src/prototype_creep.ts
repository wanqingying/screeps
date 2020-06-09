import { checkRenewCreep } from './lib_creep';
import { find_source_min_harvester } from './lib_room';

Creep.prototype.run = function () {
    const creep = this;
    checkRenewCreep(creep);
    if (!creep.memory.renew) {
        const rs = w_roles[creep.memory?.role];
        if (rs && rs.setUp) {
            rs.setUp(creep);
        } else {
            creep.log('no role', creep.memory?.role);
        }
    }
};

Creep.prototype.getRenewFailTime = function () {
    return this.getCache().renewTime;
};
Creep.prototype.increaseRenewFailTime = function () {
    const creep = this;
    const che = creep.getCache();
    che.renewTime++;
    return this.renewTime;
};

Creep.prototype.resetRenewFailTime = function () {
    const creep = this;
    const che = creep.getCache();
    che.renewTime = 0;
    return this.renewTime;
};

Creep.prototype.getCache = function () {
    const creep = this;
    let che: CacheCreep = w_creeps.get(creep.name);
    if (!che) {
        che = { renewTime: 0 };
        w_creeps.set(creep.name, che);
    }
    if (typeof che.renewTime !== 'number') {
        che.renewTime = 0;
        w_creeps.set(creep.name, che);
    }
    return che;
};

export function getActionLockTarget<T>(
    creep: Creep,
    getTarget
): { target: T; reset_target: () => void } {
    let target;
    if (creep.memory.lock_id) {
        target = Game.getObjectById(creep.memory.id);
    } else {
        target = getTarget();
        creep.memory.lock_id = target?.id;
    }
    function reset() {
        creep.memory.lock_id = undefined;
    }
    return { target, reset_target: reset };
}

Creep.prototype.harvestSource = function () {
    const creep = this;

    let { target, reset_target } = getActionLockTarget<Source>(creep, () => {
        const target = creep.findSource();
        return target?.source;
    });

    if (!target) {
        return false;
    }

    if (target.energy === 0 && target.ticksToRegeneration > 500) {
        // 能量耗尽时切换目标
        reset_target();
        creep.say('source empty see another');
        return false;
    }

    creep.harvest(target);
    creep.findAndMoveToSourcePos(target);
    return true;
};

Creep.prototype.findAndMoveToSourcePos = function (target) {
    const creep = this;
    let sh = creep.room.sourceInfo.find(t => t.source.id === target.id);
    if (!sh?.container) {
        return creep.moveToTarget(target);
    } else {
        return creep.moveToTarget(sh.container);
    }
};
Creep.prototype.findSource = function () {
    const creep = this;
    let sourceH = creep.room.sourceInfo.sort((a, b) => {
        return a.speed - b.speed;
    });
    return sourceH.shift();
};
Creep.prototype.moveToTarget = function (target: RoomPosition) {
    const creep = this;
    const far = w_utils.count_distance(creep, target);
    if (far > 1) {
        return creep.moveTo(target);
    }
    return OK;
};
Creep.prototype.isEmpty = function (type = RESOURCE_ENERGY) {
    return this.store.getFreeCapacity(type) === 0;
};
Creep.prototype.isFull = function (type = RESOURCE_ENERGY) {
    return this.store.getUsedCapacity(type) === 0;
};

function findDropTarget() {}

// 捡最大的垃圾
function pickEnergyFormMine(creep: Creep, min?: number) {
    let pick_min = min || 0;

    let target: Resource;
    if (creep.memory.target_drop_source_id) {
        // 当前的目标数量大于0则继续
        let t: Resource = Game.getObjectById(creep.memory.target_drop_source_id);
        if (t && t.amount > 0) {
            target = t;
        } else {
            creep.memory.target_drop_source_id = undefined;
        }
    }
    if (!target) {
        let room = creep.room;
        let targets = room.dropResources;
        let target_drop = Array.from(targets)
            .sort((a, b) => {
                let ea = a.resource?.amount - a.cap;
                let eb = b.resource?.amount - b.cap;
                return ea - eb;
            })
            .filter(b => b && b?.resource?.amount)
            .pop();
        if (target_drop) {
            target_drop.cap += creep.store.getCapacity(RESOURCE_ENERGY);
            target = target_drop.resource;
        }
    }
    if (target && target.amount > pick_min) {
        creep.memory.target_drop_source_id = target.id;
        const act = creep.pickup(target);

        if (act == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        } else {
            creep.memory.target_drop_source_id = undefined;
        }
        if (act === ERR_FULL) {
            creep.say('full');
        }
    }
    return false;
}
