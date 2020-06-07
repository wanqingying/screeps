import {  get_possible_max_energy } from './lib_room';

export const role_name= {
    carrier: 'carrier',
    harvester: 'harvester',
    starter: 'starter',
    upgrader: 'upgrader',
    builder: 'builder',
};
export const config_global: ConfigGlobal = {
    enable_log: true,
    internal: {
        extension_limit: [0, 0, 5, 10, 20, 30, 40, 50, 60],
    },
    energy_lack_rate: 0.2,
    renew_max_rate: 0.4,
    energy_lack_tick: 100,
    renew_interval: 200,
    creep_order: [role_name.harvester, role_name.carrier, role_name.builder, role_name.upgrader],
};

export function get_creep_config(room: Room): RoomCreepCfg {
    return {
        [role_name.starter]: { max: 0 },
        [role_name.carrier]: { max: 2 },
        [role_name.builder]: { max: 2 },
        [role_name.harvester]: { max: 2 },
    };
}

export function get_creep_body(room: Room, role: role_name_key) {
    let energy_max = room.energyCapacityAvailable;
    const energy_lack = room.memory.energy_lack;
    let body = [MOVE, MOVE, CARRY, CARRY, WORK];

    if (energy_lack) {
        energy_max = get_possible_max_energy(room);
        return [WORK, MOVE, CARRY];
    }
    let n;
    switch (role) {
        case 'builder':
            n = Math.floor(energy_max / 200);
            return get_repeat_body(n, [MOVE, CARRY, WORK]);
        case 'carrier':
            n = Math.floor(energy_max / 100);
            return get_repeat_body(n, [MOVE, CARRY]);
        case 'harvester':
            let mk = 0;
            if (energy_max <= 400) {
                mk = 2;
            }
            if (energy_max <= 550) {
                mk = 3;
            }
            if (energy_max <= 850) {
                mk = 4;
            }
            n = Math.floor((energy_max - mk * 50) / 100);
            let mv = new Array(mk).fill(MOVE);
            let wk = new Array(n).fill(WORK);
            return mv.concat(wk);
        case 'starter':
            return body;
        case 'upgrader':
            n = Math.floor(energy_max / 200);
            return get_repeat_body(n, [MOVE, CARRY, WORK]);
    }
}

function get_repeat_body(n: number, part: any[]) {
    let bd = [];
    for (let i = 0; i < n; i++) {
        bd = bd.concat(part);
    }
    return bd;
}
