import { creep_cfg_body, role_name } from './config';
import { getBodyCost, getEnergyLevel } from './lib_base';

export function checkCreep(room: Room) {
    killCreepByConfig(room);
    killCreepByCost(room);
    // killCreepByAuto(room);
    checkSpawnCreep(room);
}

function checkSpawnCreep(room: Room) {
    let role = room.memory.spawnRole;
    if (room.spawning && role) {
        return spawnCreep(room, role);
    }
    role = checkSpawnCreepByCurrent(room);
    if (role) {
        let code: number = w_code.SPAWN_BY_ROOM;
        let che = room.getCache();
        if (che?.spawnCode === ERR_NOT_ENOUGH_RESOURCES && che.spawnFailTick > 20) {
            code = w_code.SPAWN_BY_FORCE;
        }
        return spawnCreep(room, role, code);
    }
    // role = checkSpawnCreepByAuto(room);
    if (role) {
        return spawnCreep(room, role);
    }
    role = checkSpawnCreepByConfig(room);
    if (role) {
        return spawnCreep(room, role);
    }
}
// 根据配置生成单位
function checkSpawnCreepByConfig(room: Room): role_name_key | undefined {
    const current_exist: RoleExist = room.roleExist;
    const cfg = w_config.creep_cfg_num;

    const list = Object.entries(current_exist)
        .map(([role, num]) => {
            return { role: role, num: current_exist[role] };
        })
        .filter(current => {
            let a = current.num < cfg[current.role];
            let auto = w_config.role_auto.includes(current.role);
            return a && !auto;
        })
        .sort((a, b) => {
            return a.num - b.num;
        });
    let target = list.shift();
    return target?.role;
}

// 检查当前房间的状况来生成单位
function checkSpawnCreepByCurrent(room: Room): role_name_key | undefined {
    const current_exist: RoleExist = room.roleExist;

    const current_harvester = current_exist[w_role_name.harvester];
    const current_carrier = current_exist[w_role_name.carrier];
    const cs = current_exist[w_role_name.starter];
    const count = room.creepCount;
    let many_other = current_harvester === 0 && current_carrier === 0 && count > 3 && cs < 3;
    if (count < w_config.creep_cfg_num.starter) {
        return w_role_name.starter;
    }
    // if (many_other) {
    //     return w_role_name.starter;
    // }
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
}

function checkSpawnCreepByAuto(room: Room): role_name_key | undefined {
    // 重生时间
    const tick = 300;
    // 所有的矿之和
    const source_count = room.sourceInfo.reduce((a, b) => a + b.source.energyCapacity, 0);
    // 需要的挖矿能力
    const ability = source_count / tick;
    // 实际需要达到的挖矿能力与房间发展状况相关,最小值保证冷启动,最大值可用于超频工作
    let min = 0.3;
    let max = 1;
    let rate = Math.min(max, Math.max(min, room.creepCount / room.maxCreepCount));
    let target = ability * rate;

    const carry = room.abilityCarry;
    const dig = room.abilityMine;
    let min_one = [
        { role: role_name.carrier, cur: carry },
        { role: role_name.harvester, cur: dig },
    ]
        .sort((a, b) => a.cur - b.cur)
        .shift();

    if (min_one.cur < target) {
        // 最小的一个小于目标值则生产此目标
        return min_one.role;
    }
}

function spawnCreep(room: Room, role: role_name_key, code?) {
    const body = getCreepBody(room, role, code);
    const cost = getBodyCost(body);
    const index = getCreepIndex();
    const name = `${role}_${index}`;
    const spawns = room.findBy(FIND_STRUCTURES, t => t.structureType === STRUCTURE_SPAWN);
    let che = room.getCache();
    if (spawns.length) {
        const spawn: StructureSpawn = spawns.pop() as StructureSpawn;
        const act = spawn.spawnCreep(body, name, {
            memory: { role: role, born_tick: Game.time, index: index, cost: cost },
        });
        if (act === OK) {
            room.spawning = false;
            che.spawnFailTick = 0;
            room.memory.spawnRole = undefined;
        } else {
            room.memory.spawnRole = role;
            che.spawnFailTick++;
            room.spawning = true;
            console.log(
                `spawn ${name} ` + w_utils.get_code_msg(act),
                ' need ',
                cost,
                ' current ',
                room.energyAvailable
            );
        }
        che.spawnCode = act;
        w_rooms.set(room.name, che);
    }
}

function getCreepBody(room: Room, role: role_name_key, code?: number) {
    let energy_max = room.energyCapacityAvailable;
    const che = room.getCache();
    // if (energy_lack) {
    //     energy_max = getPossibleMaxEnergy(room);
    //     return [WORK, MOVE, CARRY];
    // }
    if (room.energyStop) {
        energy_max = 300;
    }
    let index: number;
    if (code === w_code.SPAWN_BY_FORCE || che.spawnFailTick > 50 || role === role_name.starter) {
        // 用于错误恢复
        index = 0;
    } else {
        index = getEnergyLevel(energy_max) - 1;
    }

    const cfg = creep_cfg_body[role];
    let body = [];
    Object.keys(cfg).forEach(b => {
        body = body.concat(new Array(cfg[b]).fill(b));
    });
    che.spawnIndex = index;
    return body;
}

function killCreepByAuto(room: Room) {
    //todo
}
// 单位更新换代
function killCreepByCost(room: Room) {
    if (shouldStopKillCreep(room)) {
        return;
    }

    const cs = room
        .findBy(FIND_CREEPS, c => {
            if (!c.memory?.role) {
                return true;
            }
            let max = getCurrentSpawnCost(room, c.memory.role);
            return c.memory?.cost < max;
        })
        .sort((a, b) => {
            return a.memory?.cost - b.memory?.cost;
        });
    let tg = cs.shift();
    if (tg && !room.spawning) {
        console.log('kill by cost ', tg?.name, tg?.memory?.cost);
        tg.suicide();
        return;
    }
}
// 杀死过多的单位
function killCreepByConfig(room: Room) {
    if (shouldStopKillCreep(room)) {
        return;
    }
    const creeps = room.findBy(FIND_CREEPS).sort((a, b) => {
        return a.memory?.cost - b.memory?.cost;
    });
    const cfg = w_config.creep_cfg_num;
    const exists = room.roleExist;
    for (let role in exists) {
        if (w_config.role_auto.includes(role)) {
            continue;
        }
        // 当前数量
        const exist = exists[role];
        // 目标数量
        const max = cfg[role];
        if (exist > max) {
            for (let i = 0; i < creeps.length; i++) {
                let creep = creeps[i];
                if (creep.memory?.role === role) {
                    console.log(`kill by config cur/max ${exist}/${max} ${creep.name}`);
                    creep.suicide();
                    return;
                }
            }
        }
    }
}
// 挽救自杀行为
function shouldStopKillCreep(room: Room): boolean {
    const che = room.getCache();
    if (che.stopKill > 80) {
        // che.stopKill=0
        // return false
    }
    if (room.energyAvailable < room.energyCapacityAvailable) {
        // 能量未满不执行自杀
        che.stopKill++;
        return true;
    }
    if (room.creepCount < room.maxCreepCount) {
        che.stopKill++;
        // 数量未满不执行自杀
        return true;
    }
    che.stopKill = 0;
    return false;
}
// 用于 creep name
export function getCreepIndex() {
    const mk = Object.values(Game.creeps).map(k => k.memory.index);
    for (let i = 0; i < mk.length + 1; i++) {
        if (!mk.includes(i)) {
            return i;
        }
    }
}
// 当前生成单位的花销
export function getCurrentSpawnCost(room: Room, role: role_name_key) {
    const body = getCreepBody(room, role);
    return getBodyCost(body);
}

export function getPossibleMaxEnergy(room: Room): number {
    let max = 0;
    (room.memory.energyExist || []).forEach(n => {
        if (n > max) {
            max = n;
        }
    });
    return max;
}
