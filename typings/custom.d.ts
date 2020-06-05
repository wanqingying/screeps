declare type role_name = 'harvester' | 'upgrader' | 'builder' | 'starter';

declare interface CreepMemory {
    role: role_name;
    target_resource_id?: string;
    index: number;
}

declare interface Memory {
    creeps_spawn_index: number[];
    resource_energy: { [id: string]: { miners:string [] } };
}

declare namespace g {
    export interface spawn_creep_opt {
        role: role_name;
        body: BodyPartConstant[];
        name: string;
        spawn: StructureSpawn;
    }
}
