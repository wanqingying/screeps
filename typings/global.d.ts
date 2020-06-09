declare type get_code_msg_screeps = (code: ScreepsReturnCode) => string;
declare type count_distance = (a: RoomPosition, b: RoomPosition) => number;
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

declare interface SourceWithContainer {
    source: Source;
    container: StructureContainer;
    cap: number;
}

declare type CreepCfgNum = { [role in role_name_key]: number };
declare type CreepCfgBody = { [role in role_name_key]: { [k: string]: number } };
declare interface CacheRoom {
    energyCount: ListA<number>;
    energyRate: ListA<number>;
    spawnCode: any;
    spawnIndex: number;
    spawnFailTick: number;
    sources: SourceWithContainer[];
}
declare interface CacheCreep {
    renewTime: number;
}

declare type WRoom = Map<string, CacheRoom>;
declare type WCreep = Map<string, CacheCreep>;

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
        w_creeps: WCreep;
        log(...p: any): void;
    }
}

declare const ERR_TARGET_NOT_FOUND = -217;
declare const w_roles: Roles;
declare const count_distance: count_distance;
declare const w_role_name: RoleName;
declare const get_code_msg_screeps: get_code_msg_screeps;
declare const w_config: ConfigGlobal;
declare const w_cache: CacheGlobal;
declare const w_rooms: WRoom;
declare const w_creeps: WCreep;
