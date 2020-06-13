import { getBodyCost, getCreepIndex, ListA } from './lib_base';

interface RoomCache {
    // 房间当前角色数量
    c_roles_count: { [name: string]: number };
    // 房间是否停摆(长期小于 300 触发冷启动)
    c_energy_stop: boolean;
    // 生产一个单位的失败tick总数
    c_spawn_fail_tick?: number;
    // 能量充盈度
    c_energy: ListA<number>;
    // 上次支持生产操作的返回码
    c_spawn_code: any;
    // 生产中 或者将要生产的单位
    c_spawning_role: string;
    // 需要预先生产的单位
    c_refresh_creep: {
        [id: string]: { role: string; body: any[]; id: string; progress: boolean; life: number };
    };
}
let cache: { [name: string]: RoomCache } = {};
const spawn_before_die = 40;
const max_fail_tick = 150;

// 外部模块
export function load_spawn_check() {
    Object.values(Game.rooms).forEach(room => {
        if (room.controller?.my) {
            try {
                prepareCache(room);
                checkSpawnCreep(room);
            } catch (e) {
                console.log('err load_spawn_check ', room.name);
                console.log(e.message);
                console.log(e.stack);
            }
        }
    });
}
// 根据配置获取单位部件
function getCreepBody(room: Room, role: role_name_key) {
    let che = getCache(room);
    if (che.c_energy_stop || che.c_spawn_fail_tick > max_fail_tick) {
        switch (role) {
            case 'carrier':
                return [MOVE, CARRY, MOVE, CARRY];
            case 'harvester':
                return [MOVE, MOVE, WORK, WORK];
            default:
                return [MOVE, WORK, CARRY, CARRY];
        }
    }
    const cfg = w_config.rooms[room.name].creep_cfg_body[role];
    let body = [];
    Object.keys(cfg).forEach(b => {
        body = body.concat(new Array(cfg[b]).fill(b));
    });
    return body;
}
// 生产单位执行
export function spawnCreep(room: Room, role: role_name_key, mem?: any, outer?: boolean) {
    const che = getCache(room);

    if (outer) {
        if (che.c_energy_stop || che.c_spawn_fail_tick > max_fail_tick) {
            return;
        }
    }
    const body = getCreepBody(room, role);
    const cost = getBodyCost(body);
    const index = getCreepIndex();
    const name = `${role}_${index}`;
    const spawns = room.findBy(FIND_STRUCTURES, t => t.structureType === STRUCTURE_SPAWN);
    if (spawns.length) {
        const spawn: StructureSpawn = spawns.pop() as StructureSpawn;
        if (spawn.spawning) {
            return ERR_BUSY;
        }
        const gems = Object.assign({ role: role, index: index, cost: cost }, mem);
        const act = spawn.spawnCreep(body, name, {
            memory: gems,
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
            console.log('memory ', JSON.stringify(gems));
        }
        che.c_spawn_code = act;
    }
    return ERR_NOT_FOUND;
}
// 生产单位流程
function checkSpawnCreep(room: Room) {
    let che = getCache(room);
    let role = che.c_spawning_role;
    if (che.c_energy_stop || che.c_spawn_fail_tick > max_fail_tick) {
        role = '';
    }

    if (role) {
        // 如果上次生产失败 下个tick继续生产 保证每次的生产都是成功的
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
        return spawnCreep(room, role);
    }
}
// 提前生产将耗尽的单位
function getRefreshRole(room: Room) {
    const che = getCache(room);
    let t = Object.values(che.c_refresh_creep)
        .filter(c => !c.progress)
        .sort((a, b) => {
            return a.life - b.life;
        })
        .pop();
    if (t) {
        let role = t.role;
        let current_count = che.c_roles_count[role];
        const cfg = w_config.rooms[room.name].creep_cfg_num;
        let target_count = cfg[role];
        if (current_count > target_count) {
            return;
        }
        che.c_refresh_creep[t.id].progress = true;
        return role;
    }
}
// 根据配置生产单位
function getSpawnRole(room: Room) {
    const current_exist = getCache(room).c_roles_count;
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
// 准备缓存
function prepareCache(room: Room) {
    let che = getCache(room);
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
        // 计算提前生产的单位 符合当前配置的就提前生产
        let tk = creep.body.length;
        if (creep.ticksToLive < tk * 3 + spawn_before_die && !che.c_refresh_creep[creep.id]) {
            let cur_body = getCreepBody(room, creep.memory.role);
            let cost = getBodyCost(cur_body);
            if (cost === creep.memory.cost) {
                che.c_refresh_creep[creep.id] = {
                    role: creep.memory.role,
                    id: creep.id,
                    body: creep.body.map(b => b.type),
                    progress: false,
                    life: creep.ticksToLive,
                };
            }
        }
    });

    che.c_roles_count = roles_current_count;
    che.c_energy.push(room.energyAvailable);
    let c_ng = che.c_energy;
    che.c_energy_stop = c_ng.length > 20 && c_ng.every(e => e === undefined || e <= 300);
    cache[room.name] = che;
    return che;
}
// 获取缓存
function getCache(room: Room): RoomCache {
    if (!cache) {
        cache = {};
    }
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
    return che;
}
// 检查当前房间的状况来生成单位
function getRoleBoost(room: Room): role_name_key | undefined {
    const che = getCache(room);
    const current_exist = che.c_roles_count;
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
