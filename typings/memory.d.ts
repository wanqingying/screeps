declare type RoleExist = {
    [k in role_name_key]: number;
};
declare interface Memory {
    creeps_spawn_index: number[];
    resource_energy: { [id: string]: { miners: string[] } };
    renew_creeps?: { name: string; ticks: number }[];
}

declare interface CreepMemory {
    role: role_name_key;
    target_resource_id?: string;
    index?: number;
    building?: boolean;
    upgrading?: boolean;
    target_drop_source_id?: string;
    target_id?: string;
    renew_role?: RoleName;
    renew?: boolean;
    renew_tick?: number;
    process?: string;
    distance?: number;
    distance_1?: number;
    distance_2?: number;
    act_msg?: any;
    step?: number;
    cost?: number;
    id?: string;
    born_tick: number;
    renew_spawn_id?: string;
}

declare interface RoomMemory {
    username: string;
    structure: { extension: number };
    renew_count: number;
    // 过去 n tik 的饱和度
    energyRate: ListA<number>;
    // 过去 n tik 的存量
    energyExist: number[];
    spawnRole:string
}

declare interface SpawnMemory {
    tasks: any[];
}
