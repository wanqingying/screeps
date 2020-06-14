declare type get_code_msg_screeps = (code: ScreepsReturnCode) => string;
declare type count_distance = (a: RoomPosition | any, b: RoomPosition | any) => number;
declare interface ConfigGlobal {
    enable_log: boolean;
    internal: {
        extension_limit: number[];
        body_cost: { [k: string]: number };
        extension_energy: number[];
    };
    energy_lack_rate: number;
    energy_lack_tick: number;
    renew_max_rate: number;
    renew_interval: number;
    creep_order: any[];
    upgrader_only_container: boolean;
    creep_cfg_num: CreepCfgNum;
    freePlace: FreePlace;
    creep_cfg_body: CreepCfgBody;
    // auto spawn role
    role_auto: role_name_key[];
    reserve_rooms: string[];
    rooms: {
        [name: string]: CfgRoom;
    };
}

interface CfgRoom {
    creep_cfg_num: CreepCfgNum;
    creep_cfg_body: CreepCfgBody;
    claims: Claims;
}

interface Claims{
    name:string,
    creep:any[][]
}

declare interface W_Utils {
    count_distance: count_distance;
    get_code_msg: get_code_msg_screeps;
    update_cache: (key:any,cache:any)=>any;
    print: any;
}

declare type W_CODE = {
    SPAWN_BY_ROOM: 6;
    SPAWN_BY_FORCE: 9;
    SPAWN_BY_CONFIG: 8;
    SPAWN_BY_AUTO: 7;

    ERR_TARGET_NOT_FOUND: -217;
    ERR_TARGET_FULL: -217;
};

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

declare interface SourceWithContainer {
    source: Source;
    container: StructureContainer;
    cap: number;
}

declare interface CacheGlobalRoom{

}

declare type CreepCfgNum = { [role in role_name_key]: number };
declare type FreePlace = { [role in role_name_key]: any };
declare type CreepCfgBody = { [role in role_name_key]: { [k: string]: number } };

declare namespace NodeJS {
    export interface Global {
        w_role_name: RoleName;
        w_config: ConfigGlobal;
        w_roles: Roles;
        // ERR_TARGET_NOT_FOUND: -217;
        w_cache: CacheGlobal;
        cache_tick: 50;
        module_loaded: boolean;
        w_code: W_CODE;
        w_utils: W_Utils;
        w_debug_creep: string;
        w_log(...p: any): void;
        w_a_log(...p: any): void;
        w_my_name: string;
        w_set_tick_out(tick: number, fn: Function): void;
    }
}

declare const w_roles: Roles;
declare const w_role_name: RoleName;
declare const w_config: ConfigGlobal;
declare const w_cache: CacheGlobal;
declare const w_code: W_CODE;
declare const w_utils: W_Utils;
declare const w_debug_creep: string;
declare const w_my_name: string;
