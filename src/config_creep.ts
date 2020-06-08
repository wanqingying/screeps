export function get_creep_config(room: Room): RoomCreepCfg {
    return {
        [role_name.starter]: { max: 0 },
        [role_name.carrier]: { max: 4 },
        [role_name.builder]: { max: 2 },
        [role_name.harvester]: { max: 4 },
        [role_name.upgrader]: { max: 3 },
    };
}
export function get_possible_max_energy(room: Room): number {
    let max = 0;
    room.memory.energy_rate.forEach(r => {
        if (r > max) {
            max = r;
        }
    });
    return Math.floor(max * room.energyCapacityAvailable);
}
export function get_creep_body2(room: Room, role: role_name_key) {
    let energy_max = room.energyCapacityAvailable;
    const energy_lack = room.memory.energy_lack;
    let body = [MOVE, MOVE, CARRY, CARRY, WORK];

    if (energy_lack) {
        energy_max = get_possible_max_energy(room);
        return [WORK, MOVE, CARRY];
    }
    if (room.memory.energy_stop) {
        energy_max = 300;
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
            if (energy_max <= 600) {
                mk = 2;
            }
            if (energy_max <= 850) {
                mk = 3;
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

export function get_creep_body(room: Room, role: role_name_key) {
    let energy_max = room.energyCapacityAvailable;
    const energy_lack = room.memory.energy_lack;
    if (energy_lack) {
        energy_max = get_possible_max_energy(room);
        return [WORK, MOVE, CARRY];
    }
    if (room.memory.energy_stop) {
        energy_max = 300;
    }
    let m = 0;
    if (energy_max === 550) {
        m = 1;
    }
    if (energy_max === 800) {
        m = 2;
    }
    const bda = {
        [role_name.carrier]: [
            { [MOVE]: 3, [CARRY]: 3 },
            { [MOVE]: 3, [CARRY]: 8 },
            { [MOVE]: 3, [CARRY]: 15 },
        ],
        [role_name.starter]: [
            { [MOVE]: 3, [CARRY]: 3 },
            { [MOVE]: 3, [CARRY]: 8 },
            { [MOVE]: 3, [CARRY]: 15 },
        ],
        [role_name.harvester]: [
            { [MOVE]: 2, [WORK]: 2 },
            { [MOVE]: 2, [WORK]: 4,[CARRY]:1 },
            { [MOVE]: 2, [WORK]: 7 },
        ],
        [role_name.builder]: [
            { [MOVE]: 2, [WORK]: 1, [CARRY]: 2 },
            { [MOVE]: 3, [WORK]: 2, [CARRY]: 4 },
            { [MOVE]: 3, [WORK]: 4, [CARRY]: 5 },
        ],
        [role_name.upgrader]: [
            { [MOVE]: 2, [WORK]: 4, [CARRY]: 1 },
            { [MOVE]: 2, [WORK]: 4, [CARRY]: 1 },
            { [MOVE]: 2, [WORK]: 6, [CARRY]: 2 },
        ],
    };
    let role_cfg=bda[role];
    let cfg=role_cfg[m]
    let bs=[];
    Object.keys(cfg).forEach(b=>{
        bs=bs.concat(new Array(cfg[b]).fill(b));
    })
    return bs
}

export function get_creep_body_cost(room:Room,role:role_name_key) {
    let bd=get_creep_body(room,role);
    let cost=0;
    bd.forEach(b=>{
        cost+=config.internal.body_cost[b];
    })
    return cost;
}

function get_repeat_body(n: number, part: any[]) {
    let bd = [];
    for (let i = 0; i < n; i++) {
        bd = bd.concat(part);
    }
    return bd;
}
