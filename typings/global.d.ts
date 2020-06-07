declare type get_code_msg_screeps = (code: ScreepsReturnCode) => string;
declare type count_distance = (a: RoomPosition, b: RoomPosition) => number;
declare interface ConfigGlobal {
    enable_log: boolean;
    internal: {
        extension_limit: number[];
        body_cost:{[k:string]:number}
    };
    energy_lack_rate: number;
    energy_lack_tick: number;
    renew_max_rate: number;
    renew_interval: number;
    creep_order: any[];
}

declare interface Role {
    setUp: (creep: Creep) => void;
}
declare type Roles = {
    [name in role_name_key]: Role;
};

declare namespace NodeJS {
    export interface Global {
        get_code_msg_screeps: get_code_msg_screeps;
        role_name: role_name;
        count_distance: count_distance;
        config: ConfigGlobal;
        roles: Roles;
    }
}

declare const roles: Roles;
declare const count_distance: count_distance;
declare const role_name: role_name;
declare const get_code_msg_screeps: get_code_msg_screeps;
declare const config: ConfigGlobal;
