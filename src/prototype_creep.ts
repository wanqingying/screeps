import { renew_creep } from './lib_creep';

Creep.prototype.run = function () {
    const creep = this;
    if (creep.memory.renew) {
        creep.increaseRenewTime();
        creep.say('renew')
        renew_creep(creep);
    } else {
        const rs = w_roles[creep.memory?.role];
        if (rs && rs.setUp) {
            rs.setUp(creep);
        } else {
            creep.log('no role', creep.memory?.role);
        }
    }
};

Creep.prototype.getRenewTime = function () {
    return this.getCache().renewTime;
};
Creep.prototype.increaseRenewTime = function () {
    const creep = this;
    const che = creep.getCache();
    che.renewTime++;
    return this.renewTime;
};

Creep.prototype.getCache = function () {
    const creep = this;
    let che: CacheCreep = w_creeps.get(creep.name);
    if (!che) {
        che = { renewTime: 0 };
        w_creeps.set(creep.name, che);
    }
    return che;
};

Creep.prototype.pickUpEnergyFromMine = function () {
    const creep = this;
    const sources = creep.room.sourceInfo;
    const h = RESOURCE_ENERGY;
    const preId = creep.memory.target_drop_source_id;
    let target: StructureContainer;

    if (preId) {
        const t: StructureContainer = Game.getObjectById(preId);
        if (t && t.store && t.store.getUsedCapacity(h) > 0) {
            target = t;
        }
    }
    if (!target) {
        for (let i = 0; i < sources.length; i++) {
            let source_h = sources[i];
            if (
                source_h.container &&
                source_h.container.store.getUsedCapacity(h) > creep.store.getCapacity(h)
            ) {
                target = source_h.container;
                break;
            }
        }
    }

    if (target) {
        creep.memory.target_drop_source_id = target.id;
        creep.memory.target_drop_source_id = target.id;
        const act = creep.withdraw(target);

        if (act == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
            return true;
        } else {
            creep.memory.target_drop_source_id = undefined;
        }
        return act === OK;
    }
    return false;
};

function findDropTarget() {

}

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
