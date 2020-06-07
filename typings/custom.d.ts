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
    act_msg?: any;
    step?: number;
}

declare interface Memory {
    creeps_spawn_index: number[];
    resource_energy: { [id: string]: { miners: string[] } };
    renew_creeps?: { name: string; ticks: number }[];
}
declare namespace NodeJS {
    export interface Global {
        get_code_msg_screeps: (code: ScreepsReturnCode) => string;
    }
}

declare interface Creep {
    // 捡起最大的垃圾
    pick_up_max_drop: (target: any) => boolean;
    target_id?: string;
    target_id_mine_energy?: string;
    target_id_drop_source?: string;
    target_id_move_to?: string;
    // 工作前自检，false则表示无法工作
    action_before_work?: () => boolean;
    // 运输到最近的仓库
    transfer_nearby: () => boolean;
    log: (p: any) => void;
}
