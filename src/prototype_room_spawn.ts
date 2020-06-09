import { creep_cfg_body } from './config';
import { getPossibleMaxEnergy } from './prototype_spawn';
import { getEnergyLevel } from './lib_base';

export function checkCreep(room: Room) {
    killMoreCreep(room);
    refreshCreep(room);
    checkSpawnCreep(room);
}

function checkSpawnCreep(room: Room) {
    if (room.spawning && room.memory.spawnRole) {
        return spawnCreep(room, room.memory.spawnRole);
    }
    let role;
    const need = checkCurrentCreep(room);
    if (need) {
        spawnCreep(room, need as role_name_key, 9);
    } else {
        role = checkRoleCfg(room);
    }
    if (role) {
        room.spawning = true;
        spawnCreep(room, role as role_name_key);
    }
}
// 根据配置生成单位
function checkRoleCfg(room: Room) {
    const current_exist: RoleExist = room.roleExist;
    const cfg = w_config.creep_cfg_num;

    // role 的数量从小到大的排列 从左到右找一个数量不满的role来生成
    const list = Object.entries(current_exist)
        .map(([role, num]) => {
            return { role: role, num: current_exist[role] };
        })
        .sort((a, b) => {
            return a.num - b.num;
        });
    let target = list.shift();

    while (list.length && target.num >= cfg[target.role]) {
        target = list.shift();
    }
    if (target.num < cfg[target.role]) {
        return target.role;
    }
}

// 检查当前房间的状况来生成单位
function checkCurrentCreep(room: Room) {
    const current_exist: RoleExist = room.roleExist;

    const current_harvester = current_exist[w_role_name.harvester];
    const current_carrier = current_exist[w_role_name.carrier];
    const cs = current_exist[w_role_name.starter];
    const count = room.creepCount;
    let needM = current_harvester === 0 && current_carrier === 0 && count > 3 && cs < 3;
    if (count < 4) {
        return w_role_name.starter;
    }
    if (needM) {
        return w_role_name.starter;
    }
    if (current_harvester < 1) {
        return w_role_name.harvester;
    }
    if (current_carrier < 1) {
        return w_role_name.carrier;
    }
    if (current_harvester < 2) {
        return w_role_name.harvester;
    }
    if (current_carrier < 2) {
        return w_role_name.carrier;
    }
    if (room.sourceInfo.find(s => s.speed < 4)) {
        return w_role_name.harvester;
    }
}

function spawnCreep(room: Room, role: role_name_key, k?) {
    const body = getCreepBody(room, role, k);
    const index = getCreepIndex();
    const name = `${role}_${index}`;
    const spawns = room.findBy(FIND_STRUCTURES, t => t.structureType === STRUCTURE_SPAWN);
    let che = room.getRoomCache();
    if (spawns.length) {
        const spawn: StructureSpawn = spawns.pop() as StructureSpawn;
        const act = spawn.spawnCreep(body, name, {
            memory: { role: role, born_tick: Game.time, index: index },
        });
        if (act === OK) {
            room.spawning = false;
            che.spawnFailTick = 0;
            room.memory.spawnRole = undefined;
        } else {
            room.memory.spawnRole = role;
            che.spawnFailTick++;
            room.spawning = true;
            room.log(`spawn ${name} ` + get_code_msg_screeps(act));
        }
        che.spawnCode = act;
        w_rooms.set(room.name, che);
    }
}

function getCreepBody(room: Room, role: role_name_key, k?: number) {
    let energy_max = room.energyCapacityAvailable;
    const energy_lack = room.energyLack;
    const che = w_rooms.get(room.name);
    if (energy_lack) {
        energy_max = getPossibleMaxEnergy(room);
        return [WORK, MOVE, CARRY];
    }
    if (room.energyStop) {
        energy_max = 300;
    }
    let index = 0;
    if (k === 9 && che?.spawnCode === ERR_NOT_ENOUGH_RESOURCES && che.spawnFailTick > 30) {
        // 用于错误恢复
        index = 0;
    } else {
        index = getEnergyLevel(energy_max) - 1;
    }
    const cfg_role = creep_cfg_body[role];
    const cfg = cfg_role[index];
    let body = [];
    Object.keys(cfg).forEach(b => {
        body = body.concat(new Array(cfg[b]).fill(b));
    });
    che.spawnIndex = index;
    return body;
}

// 单位更新换代
function refreshCreep(room: Room) {
    if (shouldStopKillCreep(room)) {
        return;
    }
    const energy_full = room.energyFull;
    const cs = room
        .findBy(FIND_CREEPS, c => {
            if (!c.memory?.role) {
                return false;
            }
            let max = getCurrentMaxBodyCost(room, c.memory.role);
            return c.memory?.cost < max;
        })
        .sort((a, b) => {
            return a.memory?.cost - b.memory?.cost;
        });
    let tg = cs.shift();
    if (tg && energy_full && !room.spawning) {
        tg.log('die auto ');
        tg.suicide();
        return;
    }
}
// 杀死过多的单位
function killMoreCreep(room: Room) {
    if (shouldStopKillCreep(room)) {
        return;
    }
    const creeps = room.findBy(FIND_CREEPS).sort((a, b) => {
        return a.memory?.cost - b.memory?.cost;
    });
    const cfg = w_config.creep_cfg_num;
    const exists = room.roleExist;
    for (let role in exists) {
        // 当前数量
        const exist = exists[role];
        // 目标数量
        const max = cfg[role];
        if (exist > max) {
            for (let i = 0; i < creeps.length; i++) {
                let creep = creeps[i];
                if (creep.memory?.role === role) {
                    creep.suicide();
                    return;
                }
            }
        }
    }
}

function shouldStopKillCreep(room: Room): boolean {
    if (room.energyAvailable !== room.energyCapacityAvailable) {
        // 能量未满不执行自杀
        return true;
    }
    if (room.creepCount < room.maxCreepCount) {
        return true;
    }
    return false;
}

export function getCreepIndex() {
    const mk = Object.values(Game.creeps).map(k => k.memory.index);
    for (let i = 0; i < mk.length + 1; i++) {
        if (!mk.includes(i)) {
            return i;
        }
    }
}

Room.prototype.getCurrentMaxBodyCost = function (role: role_name_key) {
    const room = this;
    const body = getCreepBody(room, role);
    let cost = 0;
    body.forEach(b => {
        cost += w_config.internal.body_cost[b];
    });
    return cost;
};

export function getCurrentMaxBodyCost(room: Room, role: role_name_key) {
    const body = getCreepBody(room, role);
    let cost = 0;
    body.forEach(b => {
        cost += w_config.internal.body_cost[b];
    });
    return cost;
}
