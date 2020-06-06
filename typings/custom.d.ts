//MOVE 50
//WORK 100
//CARRY 50
//ATTACK 80
//RANGED_ATTACK 150
//HEAL 250
//CLAIM 600
//TOUGH 10

declare type RoleName =
    | 'harvester'
    | 'upgrader'
    | 'builder'
    | 'starter'
    | 'worker'
    | 'carry'
    | 'container_carry'
    | 'renew'
    | 'heal';

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
    act_msg?:any
    step?:number
}

declare interface Memory {
    creeps_spawn_index: number[];
    resource_energy: { [id: string]: { miners: string[] } };
    renew_creeps?: { name: string; ticks: number }[];
}

declare namespace g {
    export interface spawn_creep_opt {
        role: RoleName;
        body: BodyPartConstant[];
        name: string;
        spawn: StructureSpawn;
    }
}
