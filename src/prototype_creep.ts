import { getCache } from './lib_creep';

Creep.prototype.run = function () {
    const creep: Creep = this;
    if (creep.spawning) {
        return;
    }
    let che = getCache(creep);
    creep.log_one(che.tick);
    che.tick++;
    // checkRenewCreep(creep);
    if (!creep.memory.renew) {
        const rs = w_roles[creep.memory?.role];
        if (rs && rs.setUp) {
            rs.setUp(creep);
        } else {
            creep.log('no role', creep.memory?.role);
        }
    }
};

Creep.prototype.getCache = function () {
    const creep = this;
    return getCache(creep);
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

Object.defineProperty(Creep.prototype, 'cost', {
    get(): number {
        const creep = this;
        let cost = 0;
        creep.body.forEach(b => {
            const type = b.type;
            cost += w_config.internal.body_cost[type];
        });
        return cost;
    },
});
