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
    cost: number;
    index: number;
    born_tick: number;
    target_resource_id?: string;
    building?: boolean;
    upgrading?: boolean;
    target_drop_source_id?: string;
    target_id?: string;
    lock_id?: string;
    renew_role?: RoleName;
    renew?: boolean;
    renew_tick?: number;
    process?: string;
    distance?: number;
    act_msg?: any;
    step?: number;
    id?: string;
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
    // 正在生产的角色
    spawnRole: string;
}

declare interface SpawnMemory {
    tasks: any[];
}
