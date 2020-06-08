import { renew_creep } from './lib_creep';

Creep.prototype.run = function () {
    const creep = this;
    if (creep.memory.renew) {
        renew_creep(creep);
    } else {
        const rs = roles[creep.memory?.role];
        if (rs && rs.setUp) {
            rs.setUp(creep);
        } else {
            creep.log('no role', creep.memory?.role);
        }
        // roles[creep.memory.role].setUp(creep);
    }
};

Creep.prototype.prepare = function () {
    const creep = this;
};
