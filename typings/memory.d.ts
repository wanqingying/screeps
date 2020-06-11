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
    renew_role?: RoleName;
    renew?: boolean;
    renew_tick?: number;
    process?: string;
    distance?: number;
    renew_spawn_id?: string;
}

declare interface RoomMemory {
    username: string;
    structure: { extension: number };
    renew_count: number;
    // 正在生产的角色
    spawnRole: string;
}

declare interface SpawnMemory {
    tasks: any[];
}
