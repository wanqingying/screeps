import './bootstrap';

import * as mod from './mod';
import { BaseLink } from './base_link';
import { BaseClaim } from './claim';

function main() {
    console.log(
        '===============================tick===============================================',
        Game.time
    );
    Object.values(Game.rooms).forEach(room => {});
    mod.load_cache();
    // 生产单位
    // mod.load_spawn_check();
    mod.SpawnAuto.start();
    // 防御塔
    mod.load_tower_logic();
    // 采矿
    mod.load_harvest();
    // 运输
    mod.TransportDriver.start();
    // mod.load_distribution_transport();
    mod.load_builder();
    mod.load_upgrader();
    mod.load_starter();
    mod.load_claim();
    mod.load_repair();
    mod.load_defence();
    mod.load_scout();
    mod.load_scout();
    mod.load_remote_transport();
    mod.load_remote_harvest();
    mod.load_remote_reserve();
    mod.load_remote_attack();
    mod.RemoteBuilder.start();
    BaseClaim.start();
    BaseLink.start();
    Object.keys(Memory.creeps).forEach(name => {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    });
    // 放在最后执行可支持 setTickOut(0,fn)
    mod.load_tick_out();
}

module.exports.loop = main;
