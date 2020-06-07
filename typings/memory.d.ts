declare interface CreepMemory {
    role: RoleName;
    target_resource_id?: string;
    index: number;
    building?: boolean;
    upgrading?: boolean;
    target_drop_source_id?: string;
    target_id?: string;
    renew_role?: RoleName;
    process?: string;
    distance?: number;
    distance_1?: number;
    distance_2?: number;
    act_msg?: any;
    step?: number;
}

declare interface Memory {
    creeps_spawn_index: number[];
    resource_energy: { [id: string]: { miners: string[] } };
    renew_creeps?: { name: string; ticks: number }[];
    cpa:string
    rooms_h:RoomH
}

declare interface RoomH {
    [name: string]: { resource_energy: { id: string; harvester: string[] }[] }
}
