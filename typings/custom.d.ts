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

declare interface role_name {
    carrier: 'carrier';
    harvester: 'harvester';
    starter: 'starter';
    upgrader: 'upgrader';
    builder: 'builder';
}
declare type role_name_key = keyof role_name;

declare interface Source_h {
    target: Source;
    harvester: Creep[];
}

declare interface StructureHasStore extends Structure<any> {
    store: Store<any, any>;
}

declare interface RoomCreepCfg {
    [role: string]: {
        max: number;
    };
}

