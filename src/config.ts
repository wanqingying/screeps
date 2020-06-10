export const role_name = {
    carrier: 'carrier',
    harvester: 'harvester',
    starter: 'starter',
    upgrader: 'upgrader',
    builder: 'builder',
    scout: 'scout',
};
global.w_role_name = role_name;

// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]
export const creep_cfg_body = {
    [role_name.carrier]: [
        { [MOVE]: 3, [CARRY]: 3 },
        { [MOVE]: 3, [CARRY]: 8 },
        { [MOVE]: 3, [CARRY]: 13 },
        { [MOVE]: 4, [CARRY]: 22 },
    ],
    [role_name.starter]: [
        { [MOVE]: 2, [CARRY]: 2, [WORK]: 1 },
        { [MOVE]: 2, [CARRY]: 2, [WORK]: 3 },
        { [MOVE]: 3, [CARRY]: 15 },
        { [MOVE]: 3, [CARRY]: 15 },
    ],
    [role_name.harvester]: [
        { [MOVE]: 2, [WORK]: 2 },
        { [MOVE]: 2, [WORK]: 4, [CARRY]: 1 },
        { [MOVE]: 2, [WORK]: 7 },
        { [MOVE]: 4, [WORK]: 10, [CARRY]: 2 },
    ],
    [role_name.builder]: [
        { [MOVE]: 2, [WORK]: 1, [CARRY]: 2 },
        { [MOVE]: 3, [WORK]: 2, [CARRY]: 4 },
        { [MOVE]: 3, [WORK]: 4, [CARRY]: 5 },
        { [MOVE]: 4, [WORK]: 5, [CARRY]: 12 },
    ],
    [role_name.upgrader]: [
        { [MOVE]: 2, [WORK]: 4, [CARRY]: 1 },
        { [MOVE]: 2, [WORK]: 4, [CARRY]: 1 },
        { [MOVE]: 2, [WORK]: 6, [CARRY]: 2 },
        { [MOVE]: 5, [WORK]: 8, [CARRY]: 5 },
    ],
    [role_name.scout]: [
        { [MOVE]: 2, [CARRY]: 2, [WORK]: 1 },
        { [MOVE]: 2, [CARRY]: 2, [WORK]: 3 },
        { [MOVE]: 3, [CARRY]: 15 },
        { [MOVE]: 3, [CARRY]: 15 },
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

export const creep_cfg_num = {
    [role_name.starter]: 0,
    [role_name.scout]: 0,
    [role_name.carrier]: 1,
    [role_name.builder]: 1,
    [role_name.harvester]: 2,
    [role_name.upgrader]: 0,
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
    energy_lack_rate: 0.5,
    renew_max_rate: 0.4,
    energy_lack_tick: 100,
    renew_interval: 200,
    creep_order: [role_name.harvester, role_name.carrier, role_name.builder, role_name.upgrader],
    upgrader_only_container: true,
    creep_cfg_body: creep_cfg_body as any,
    creep_cfg_num: creep_cfg_num as any,
    role_auto: [role_name.carrier, role_name.harvester],
};

global.w_config = config_global;
global.w_code = {
    SPAWN_BY_CONFIG: 8,
    SPAWN_BY_FORCE: 9,
    SPAWN_BY_AUTO: 7,
    SPAWN_BY_ROOM: 6,
};

global.module_loaded = true;
