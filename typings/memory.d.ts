declare interface Memory {
    creeps_spawn_index: number;
    resource_energy: { [id: string]: { miners: string[] } };
    renew_creeps?: { name: string; ticks: number }[];
}

declare interface CreepMemory {
    role: role_name_key;
    remote?: string;
    from?: string;
    scout_target?: string;
    cost: number;
    index: number;
    building?: boolean;
    upgrading?: boolean;
    // get_transport 物流系统get
    process?: string|any;
    // transport in out
    trans_direct?: string;
    distance?: number;
    ack_tick?: number;
    mv_tick?: number;
    remote_task_id?: string;
    task_id?: string;
    remote_source_id?: string;
    target_room: string;
    obj: any;
}

declare interface RoomMemory {
    username: string;
    structure: { extension: number };
    renew_count: number;
    // 正在生产的角色
    spawning_role: string;
    ext_creep: any;
}

declare interface SpawnMemory {
    tasks: any[];
}
declare interface SpawnMemory {
    spawning_role: string;
}
