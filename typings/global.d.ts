declare type get_code_msg_screeps = (code: ScreepsReturnCode) => string;
declare type count_distance = (a: RoomPosition, b: RoomPosition) => number;
declare interface ConfigGlobal {
    enable_log: boolean;
    internal: {
        extension_limit: number[];
        body_cost: { [k: string]: number };
    };
    energy_lack_rate: number;
    energy_lack_tick: number;
    renew_max_rate: number;
    renew_interval: number;
    creep_order: any[];
    upgrader_only_container: boolean;
    creep_cfg_num: CreepCfgNum;
    creep_cfg_body: CreepCfgBody;
}

declare interface Role {
    setUp: (creep: Creep) => void;
    targets: any;
    vt: number;
}
declare type Roles = {
    [name in role_name_key]: Role;
};
declare type CacheGlobal = Map<any, any>;
declare type RoleName = {
    [role in role_name_key]: string;
};

declare type CreepCfgNum = { [role in role_name_key]: number };
declare type CreepCfgBody = { [role in role_name_key]: { [k: string]: number } };
declare type WRoom = Map<string, { energyCount: ListA<number>; energyRate: ListA<number> }>;

declare namespace NodeJS {
    export interface Global {
        get_code_msg_screeps: get_code_msg_screeps;
        w_role_name: RoleName;
        count_distance: count_distance;
        w_config: ConfigGlobal;
        w_roles: Roles;
        ERR_TARGET_NOT_FOUND: -217;
        w_cache: CacheGlobal;
        cache_tick: 50;
        module_loaded: boolean;
        w_rooms: WRoom;
    }
}

declare const ERR_TARGET_NOT_FOUND = -217;
declare const roles: Roles;
declare const count_distance: count_distance;
declare const role_name: RoleName;
declare const get_code_msg_screeps: get_code_msg_screeps;
declare const config: ConfigGlobal;
declare const cache: CacheGlobal;
