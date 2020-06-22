import './bootstrap';

import * as mod from './mod';
import { BaseRoom } from './base_room';
import { RoomCache } from './room_cache';

import { BaseLink } from './base_link';
import { BaseClaim } from './claim';
import * as role from './role';
import { stat_scan } from './z_stat';

function main() {
    g_log('========================tick==================================', Game.time);
    Object.values(Game.rooms).forEach(room => {
        g_log(room.name, room.energyAvailable, '/', room.energyCapacityAvailable);
    });
    BaseRoom.start();
    RoomCache.start();
    mod.load_cache();

    mod.SpawnAuto.start();
    // 防御塔
    mod.load_tower_logic();
    // 采矿
    // 运输
    mod.TransportDriver.start();
    mod.load_starter();
    mod.load_claim();
    mod.load_defence();
    mod.load_scout();
    mod.RemoteRepair.start();
    mod.RemoteBuilder.start();
    mod.RemoteHarvest.start();
    mod.RemoteTransport.start();
    mod.RemoteReserveW.start();
    mod.RemoteAttackW.start();
    BaseClaim.start();
    BaseLink.start();
    role.BaseRoleBuilder.start();
    role.BaseRoleCarry.start();
    role.BaseRoleHarvest.start();
    role.BaseRoleUpgrader.start();
    role.BaseRoleUpg.start();
    role.BaseRoleRepair.start();
    Object.keys(Memory.creeps).forEach(name => {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    });
    // 放在最后执行可支持 setTickOut(0,fn)
    mod.load_tick_out();
    stat_scan();
}

module.exports.loop = main;
