// import { creep_cfg_num,creep_cfg_body } from './config';

import { creep_cfg_body } from './config';

Spawn.prototype.runTask = function () {
    const spawn: StructureSpawn = this;
    spawn.memory.tasks = [];
};

export function getPossibleMaxEnergy(room: Room): number {
    let max = 0;
    room.memory.energyExist.forEach(n => {
        if (n > max) {
            max = n;
        }
    });
    return max;
}

export function getCurrentMaxBodyCost(room: Room, role: role_name_key) {
    const body = getCreepBody(room, role);
    let cost = 0;
    body.forEach(b => {
        cost += config.internal.body_cost[b];
    });
    return cost;
}

function getCreepBody(room: Room, role: role_name_key) {
    let energy_max = room.energyCapacityAvailable;
    const energy_lack = room.memory.energyLack;
    if (energy_lack) {
        energy_max = getPossibleMaxEnergy(room);
        return [WORK, MOVE, CARRY];
    }
    if (room.memory.energyStop) {
        energy_max = 300;
    }
    const index = getEnergyLevel(energy_max);
    const cfg_role = creep_cfg_body[role];
    const cfg = cfg_role[index];
    let body = [];
    Object.keys(cfg).forEach(b => {
        body = body.concat(new Array(cfg[b]).fill(b));
    });
    return body;
}

// 获取等级
function getEnergyLevel(energyMax: number) {
    // 每等级扩展提供的数量
    const energy_ext = [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000];
    let min = 0;
    let max = 0;
    for (let i = 1; i < energy_ext.length; i++) {
        min = 300 + energy_ext[i - 1];
        max = 300 + energy_ext[i];
        if (min < energyMax && energyMax <= max) {
            return i;
        }
    }
}
