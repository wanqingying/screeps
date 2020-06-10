export const role_name = {
    carrier: 'carrier',
    harvester: 'harvester',
    starter: 'starter',
    upgrader: 'upgrader',
    builder: 'builder',
    scout: 'scout',
};
global.w_role_name = role_name;
//=============1==2====3====4=====5=====6
// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]
export const creep_cfg_body = {
    [role_name.carrier]: { [MOVE]: 13, [CARRY]: 13 },
    [role_name.starter]: { [MOVE]: 2, [CARRY]: 1, [WORK]: 2 },
    [role_name.harvester]: { [MOVE]: 4, [WORK]: 11, [CARRY]: 0 },
    [role_name.builder]: { [MOVE]: 6, [WORK]: 7, [CARRY]: 6 },
    [role_name.upgrader]: { [MOVE]: 2, [WORK]: 11, [CARRY]: 2 },
    [role_name.scout]: { [MOVE]: 1, [CARRY]: 0 },
};

export const creep_cfg_num = {
    [role_name.starter]: 0,
    [role_name.carrier]: 3,
    [role_name.scout]: 0,
    [role_name.builder]: 1,
    [role_name.harvester]: 2,
    [role_name.upgrader]: 2,
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
    role_auto: [],
};

global.w_config = config_global;
global.w_code = {
    SPAWN_BY_CONFIG: 8,
    SPAWN_BY_FORCE: 9,
    SPAWN_BY_AUTO: 7,
    SPAWN_BY_ROOM: 6,
} as any;

global.module_loaded = true;
