import './bootstrap';

import {
    load_tick_out,
    load_spawn_check,
    load_tower_logic,
    load_harvest,
    load_distribution_transport,
    load_builder,
    load_upgrader,
    load_starter,
    load_claim,
} from './mod';

function main() {
    Object.values(Game.rooms).forEach(room => {
        console.log(room.name, '----------------------', `${room.energyAvailable}/${room.energyCapacityAvailable}`);
    });
    // 生产单位
    load_spawn_check();
    // 防御塔
    load_tower_logic();
    // 采矿
    load_harvest();
    // 运输
    load_distribution_transport();
    load_builder();
    load_upgrader();
    load_starter();
    load_claim();
    Object.keys(Memory.creeps).forEach(name => {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    });
    // 放在最后执行可支持 setTickOut(0,fn)
    load_tick_out();
}

module.exports.loop = main;
