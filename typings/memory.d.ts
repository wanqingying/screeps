declare interface Memory {
    creeps_spawn_index: number;
    resource_energy: { [id: string]: { miners: string[] } };
    renew_creeps?: { name: string; ticks: number }[];
}

declare interface CreepMemory {
    role: role_name_key;
    remote?:string
    from?:string
    cost: number;
    index: number;
    building?: boolean;
    upgrading?: boolean;
    // get_transport 物流系统get
    process?: string;
    distance?: number;
    target_room:string
    obj:any
}

declare interface RoomMemory {
    username: string;
    structure: { extension: number };
    renew_count: number;
    // 正在生产的角色
    spawnRole: string;
    ext_creep:any
}

declare interface SpawnMemory {
    tasks: any[];
}
