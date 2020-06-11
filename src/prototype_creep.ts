import { checkRenewCreep, getCache } from './lib_creep';
import { getActionLockTarget } from './lib_base';

Creep.prototype.run = function () {
    const creep = this;
    let che = getCache(creep);
    creep.log_one(che.tick);
    che.tick++;
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
    return getCache(creep);
};

Creep.prototype.harvestSource = function () {
    const creep = this;

    let { target, unLock } = getActionLockTarget<Source>(creep, 'hs', () => {
        const target = creep.findSource();
        return target?.source;
    });

    if (!target) {
        return false;
    }

    if (target.energy === 0 && target.ticksToRegeneration > 500) {
        // 能量耗尽时切换目标
        unLock();
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
