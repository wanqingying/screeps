import './bootstrap';
import { executeTickOut } from './lib_tick_out';

function main() {
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
        console.log('energy--', `${room.energyAvailable}/${room.energyCapacityAvailable}`);
        room.start();
    });
    Object.values(Game.creeps).forEach(creep => {
        creep.run();
        // try {
        // } catch (e) {
        // }
    });
    // 放在最后执行可支持 setTickOut(0,fn)
    executeTickOut();
}

module.exports.loop = main;
