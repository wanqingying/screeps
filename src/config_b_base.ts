import { cfg_local } from './config_b_local';
import { cfg_online } from './config_b_online';

let cabs = { local: cfg_local, online: cfg_online };
let key: string;
if (Game.shard.name === 'LAPTOP-B07N3SVP') {
    key = 'local';
} else {
    key = 'online';
}
let cfg = cabs[key];

export const body_cost = {
    [MOVE]: 50,
    [WORK]: 100,
    [CARRY]: 50,
    [ATTACK]: 80,
    [RANGED_ATTACK]: 150,
    [HEAL]: 250,
    [CLAIM]: 600,
    [TOUGH]: 10,
};

global.w_roles = {} as Roles;

global.w_cache = new Map<any, any>();

export const config_global: ConfigGlobal = {
    enable_log: false,
    internal: {
        extension_limit: [0, 0, 5, 10, 20, 30, 40, 50, 60],
        body_cost: body_cost,
        extension_energy: [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000],
    },
    // 持续 n tik 能量饱和率过低则判断此房间缺能量
    upgrader_only_container: true,
    rooms: cfg,
};

global.w_config = config_global;
global.w_config.rooms = cfg;

global.w_code = {
    SPAWN_BY_CONFIG: 8,
    SPAWN_BY_FORCE: 9,
    SPAWN_BY_AUTO: 7,
    SPAWN_BY_ROOM: 6,
    REMOTE_KEY_TRANSPORT: 'REMOTE_KEY_TRANSPORT',
    REMOTE_KEY_MINE: 'REMOTE_KEY_MINE',
    REMOTE_KEY_RESERVE: 'REMOTE_KEY_RESERVE',
    REMOTE_KEY_BUILDER: 'REMOTE_KEY_BUILDER',
    REMOTE_KEY_ATTACK: 'REMOTE_KEY_ATTACK',
    DRIVER_KEY_SPAWN_AUTO: 'DRIVER_KEY_SPAWN_AUTO',
    DRIVER_KEY_REMOTE_REPAIR: 'DRIVER_KEY_REMOTE_REPAIR',
    DRIVER_KEY_REMOTE_Harvest: 'DRIVER_KEY_REMOTE_Harvest',
    DRIVER_KEY_TRANSPORT: 'DRIVER_KEY_TRANSPORT',
};
global.module_loaded = true;
