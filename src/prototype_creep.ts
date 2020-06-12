Creep.prototype.run = function () {
    const creep: Creep = this;
    // checkRenewCreep(creep);
    const rs = w_roles[creep.memory?.role];
    if (rs && rs.setUp) {
        rs.setUp(creep);
    } else {
        creep.log('no role', creep.memory?.role);
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
