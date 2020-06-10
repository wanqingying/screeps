import './bootstrap';

function main() {
    console.log('tick');
    Object.values(Game.creeps).forEach(creep => {
        let m = creep.memory?.role;
        if (!Object.values(w_role_name).includes(m)) {
            creep.suicide();
        }
        if (!creep.memory.cost) {
            let cost = 0;
            creep.body.forEach(b => {
                cost += w_config.internal.body_cost[b.type];
            });
            creep.memory.cost = cost;
        }
    });
    Object.keys(Memory.creeps).forEach(name => {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    });

    Object.values(Game.rooms).forEach(room => {
        room.start();
    });
    Object.values(Game.creeps).forEach(creep => {
        creep.run();

        try {
        } catch (e) {
            // console.t('err start creep ', creep.name, e);
        }
    });
}

module.exports.loop = main;
