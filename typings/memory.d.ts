
declare interface RoleExist{
    role:string
    exist:number
}
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
    creep_count: number;
    renew_count: number;
    energy_rate: number[];
    energy_exist: number[];
    energy_lack: boolean;
    energy_stop: boolean;
    energy_lack_tick: 50;
    energy_full: boolean;
    spawning: boolean;
    role_exist:RoleExist[]
}


