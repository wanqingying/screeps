import { role_name } from './config';

export const creep_cfg_num = {
    [role_name.starter]: 0,
    [role_name.carrier]: 4,
    [role_name.builder]: 2,
    [role_name.harvester]: 4,
    [role_name.upgrader]: 3,
};

// 每个房间等级的部件配置
export const creep_cfg_body = {
    [role_name.carrier]: [
        { [MOVE]: 3, [CARRY]: 3 },
        { [MOVE]: 3, [CARRY]: 8 },
        { [MOVE]: 3, [CARRY]: 15 },
    ],
    [role_name.starter]: [
        { [MOVE]: 3, [CARRY]: 3 },
        { [MOVE]: 3, [CARRY]: 8 },
        { [MOVE]: 3, [CARRY]: 15 },
    ],
    [role_name.harvester]: [
        { [MOVE]: 2, [WORK]: 2 },
        { [MOVE]: 2, [WORK]: 4, [CARRY]: 1 },
        { [MOVE]: 2, [WORK]: 7 },
    ],
    [role_name.builder]: [
        { [MOVE]: 2, [WORK]: 1, [CARRY]: 2 },
        { [MOVE]: 3, [WORK]: 2, [CARRY]: 4 },
        { [MOVE]: 3, [WORK]: 4, [CARRY]: 5 },
    ],
    [role_name.upgrader]: [
        { [MOVE]: 2, [WORK]: 4, [CARRY]: 1 },
        { [MOVE]: 2, [WORK]: 4, [CARRY]: 1 },
        { [MOVE]: 2, [WORK]: 6, [CARRY]: 2 },
    ],
};

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

export const config_global: ConfigGlobal = {
    enable_log: false,
    internal: {
        extension_limit: [0, 0, 5, 10, 20, 30, 40, 50, 60],
        body_cost: body_cost,
    },
    energy_lack_rate: 0.2,
    renew_max_rate: 0.4,
    energy_lack_tick: 100,
    renew_interval: 200,
    creep_order: [role_name.harvester, role_name.carrier, role_name.builder, role_name.upgrader],
    upgrader_only_container: true,
    creep_cfg_body: creep_cfg_body as any,
    creep_cfg_num: creep_cfg_num as any,
};
global.w_config = config_global;
