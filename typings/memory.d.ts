declare interface Memory {
    creeps_spawn_index: number[];
    resource_energy: { [id: string]: { miners: string[] } };
    renew_creeps?: { name: string; ticks: number }[];
}

declare interface CreepMemory {
    role: role_name_key;
    cost: number;
    index: number;
    building?: boolean;
    upgrading?: boolean;
    process?: string;
    distance?: number;
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
