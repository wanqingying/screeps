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

declare namespace NodeJS {
    export interface Global {
        get_code_msg_screeps: (code: ScreepsReturnCode) => string;
    }
}
declare interface role_name {
    carrier: 'carrier';
    harvester: 'harvester';
    starter: 'starter';
    upgrader: 'upgrader';
    builder: 'builder';
}
declare type get_code_msg_screeps = (code: ScreepsReturnCode) => string;
declare namespace NodeJS {
    export interface Global {
        get_code_msg_screeps: get_code_msg_screeps;
        role_name: role_name;
    }
}
declare const role_name: role_name;
declare const get_code_msg_screeps: get_code_msg_screeps;

declare type role_run_fn = () => void;



