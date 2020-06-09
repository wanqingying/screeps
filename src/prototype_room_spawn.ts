import { creep_cfg_body } from './config';
import { getPossibleMaxEnergy } from './prototype_spawn';
import { getEnergyLevel } from './lib_base';

Room.prototype.checkCreep = function () {
    const room = this;
    room.killMoreCreep();
    room.refreshCreep();
    room.checkSpawnCreep();
};

Room.prototype.checkSpawnCreep = function () {
    const room = this;
    const cfg = w_config.creep_cfg_num;
    const current_exist: RoleExist = room.roleExist;

    const current_harvester = current_exist[w_role_name.harvester];
    const current_carrier = current_exist[w_role_name.carrier];
    const current_starter = current_exist[w_role_name.starter];
    if (current_harvester === 0 && current_carrier === 0 && current_starter < 4) {
        return room.spawnCreep(w_role_name.starter, 9);
    }
    if (current_harvester === 0) {
        return room.spawnCreep(w_role_name.harvester, 9);
    }
    if (current_carrier === 0) {
        return room.spawnCreep(w_role_name.carrier, 9);
    }
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
    if (!target) {
        return;
    }
    if (target.num < cfg[target.role]) {
        room.spawnCreep(target.role);
    }
};

Room.prototype.spawnCreep = function (role: role_name_key, k) {
    const room = this;
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
            room.memory.spawning = false;
            che.spawnFailTick = 0;
        } else {
            che.spawnFailTick++;
            room.memory.spawning = true;
            room.log(`spawn ${name} ` + get_code_msg_screeps(act));
        }
        che.spawnCode = act;
        w_rooms.set(room.name, che);
    }
};

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
    if (k === 9 && che?.spawnCode === ERR_NOT_ENOUGH_RESOURCES && che.spawnFailTick > 50) {
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
Room.prototype.refreshCreep = function () {
    const room = this;
    const energy_full = room.memory.energyFull;
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
    if (tg && energy_full && !room.memory.spawning) {
        tg.log('die auto ');
        tg.suicide();
        return;
    }
};
// 杀死过多的单位
Room.prototype.killMoreCreep = function () {
    const room = this;
    if (room.energyAvailable !== room.energyCapacityAvailable) {
        // 能量未满不执行自杀
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
};

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
