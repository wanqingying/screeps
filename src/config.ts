export const role_name = {
    carrier: 'carrier',
    harvester: 'harvester',
    starter: 'starter',
    upgrader: 'upgrader',
    builder: 'builder',
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
    enable_log: true,
    internal: {
        extension_limit: [0, 0, 5, 10, 20, 30, 40, 50, 60],
        body_cost:body_cost
    },
    energy_lack_rate: 0.2,
    renew_max_rate: 0.4,
    energy_lack_tick: 100,
    renew_interval: 200,
    creep_order: [role_name.harvester, role_name.carrier, role_name.builder, role_name.upgrader],
};
