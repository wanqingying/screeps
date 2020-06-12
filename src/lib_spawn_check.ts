import {getActionLockTarget, getBodyCost} from './lib_base';
import { getCreepIndex } from './prototype_room_spawn';
import { ListA } from './lib_base';

interface RoomCache {
    c_roles_count: { [name: string]: number };
    c_energy_stop: boolean;
    c_spawn_fail_tick?: number;
    c_energy: ListA<number>;
    c_spawn_code: any;
    c_spawning_role: string;
    c_creep_count?: number;
    // 需要预先生产的单位
    c_refresh_creep: {
        [id: string]: { role: string; body: any[]; id: string; progress: boolean; life: number };
    };
}
const cache: { [name: string]: RoomCache } = {};
const spawn_before_die = 40;

function getCreepBody(room: Room, role: role_name_key) {
    let che = cache[room.name];
    if (che.c_energy_stop && che.c_spawn_fail_tick > 30) {
        return [MOVE, WORK, CARRY, CARRY];
    }
    const cfg = w_config.rooms[room.name].creep_cfg_body[role];
    let body = [];
    Object.keys(cfg).forEach(b => {
        body = body.concat(new Array(cfg[b]).fill(b));
    });
    return body;
}

function spawnCreep(room: Room, role: role_name_key) {
    const body = getCreepBody(room, role);
    const cost = getBodyCost(body);
    const index = getCreepIndex();
    const name = `${role}_${index}`;
    const spawns = room.findBy(FIND_STRUCTURES, t => t.structureType === STRUCTURE_SPAWN);
    const che = cache[room.name];
    if (spawns.length) {
        const spawn: StructureSpawn = spawns.pop() as StructureSpawn;
        if (spawn.spawning) {
            return ERR_BUSY;
        }
        const act = spawn.spawnCreep(body, name, {
            memory: { role: role, born_tick: Game.time, index: index, cost: cost },
        });
        if (act === OK) {
            che.c_spawning_role = '';
            che.c_spawn_fail_tick = 0;
        } else {
            che.c_spawning_role = role;
            che.c_spawn_fail_tick++;
            const { energyAvailable: eng, energyCapacityAvailable: cap } = room;
            const msg = `${spawn} ${name} ${w_utils.get_code_msg(
                act
            )}  need/current/total ${cost}/${eng}/${cap}`;
            console.log(msg);
        }
        che.c_spawn_code = act;
    }
    return ERR_NOT_FOUND;
}

function checkSpawnCreep(room: Room) {
    let che = cache[room.name];
    let role = che.c_spawning_role;
    if (room.spawning && role) {
        return spawnCreep(room, role);
    }
    role = getRoleBoost(room);
    if (role) {
        return spawnCreep(room, role);
    }
    role = getSpawnRole(room);
    if (role) {
        return spawnCreep(room, role);
    }
    role = getRefreshRole(room);
    if (role) {
        console.log('refresh ', role);
        return spawnCreep(room, role);
    }
}

function getRefreshRole(room: Room) {
    const che = cache[room.name];
    let t = Object.values(che.c_refresh_creep)
        .filter(c => !c.progress)
        .sort((a, b) => {
            return a.life - b.life;
        })
        .pop();
    if (t) {
        che.c_refresh_creep[t.id].progress = true;
        return t.role;
    }
}

function getSpawnRole(room: Room) {
    const current_exist: RoleExist = cache[room.name].c_roles_count;
    const cfg = w_config.rooms[room.name].creep_cfg_num;

    const list = Object.entries(current_exist)
        .map(([role, num]) => {
            return { role: role, current: num };
        })
        .filter(({ role, current }) => {
            return current < cfg[role];
        })
        .sort((a, b) => {
            return a.current - b.current;
        });
    let target = list.shift();
    return target?.role;
}

function prepareCache(room: Room) {
    let che = cache[room.name];
    if (!che) {
        che = {
            c_energy_stop: false,
            c_roles_count: {},
            c_spawn_fail_tick: 0,
            c_energy: new ListA<number>(30),
            c_spawn_code: null,
            c_spawning_role: '',
            c_refresh_creep: {},
        };
    }

    const roles_current_count = {};
    Object.values(w_role_name).forEach(k => {
        roles_current_count[k] = 0;
    });
    const creeps = Object.values(room.find(FIND_MY_CREEPS));
    creeps.forEach(creep => {
        const role = creep.memory.role;
        if (!roles_current_count[role]) {
            roles_current_count[role] = 1;
        } else {
            roles_current_count[role] += 1;
        }
        let tk = creep.body.length;
        if (creep.ticksToLive < tk * 3 + spawn_before_die && !che.c_refresh_creep[creep.id]) {
            che.c_refresh_creep[creep.id] = {
                role: creep.memory.role,
                id: creep.id,
                body: creep.body.map(b => b.type),
                progress: false,
                life: creep.ticksToLive,
            };
        }
    });
    che.c_roles_count = roles_current_count;
    che.c_energy.push(room.energyAvailable);
    let c_ng = che.c_energy;
    che.c_energy_stop = c_ng.length > 20 && c_ng.every(e => e === undefined || e <= 300);
    cache[room.name] = che;
}

// 检查当前房间的状况来生成单位
function getRoleBoost(room: Room): role_name_key | undefined {
    const che = cache[room.name];
    const current_exist: RoleExist = che.c_roles_count;
    const current_harvester = current_exist[w_role_name.harvester];
    const current_carrier = current_exist[w_role_name.carrier];
    const cfg = w_config.rooms[room.name];
    if (current_exist.starter < cfg.creep_cfg_num.starter) {
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
}

export function load_spawn_check() {
    Object.values(Game.rooms).forEach(room => {
        if (room.controller?.my) {
            prepareCache(room);
            checkSpawnCreep(room);
        }
    });
}
