import {
    getBodyCost,
    getCreepIndex,
    ListA,
    RemoteReserve,
    RemoteTransport,
    run_creep,
} from './lib_base';
import { getCreepBodyByRole } from './lib_creep';

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
        [id: string]: { role: string; id: string; progress: boolean; life: number };
    };
}
let cache: { [name: string]: RoomCache } = {};
const spawn_before_die = 20;
const max_fail_tick = 150;

// 外部模块
export function load_spawn_check() {
    prepareRemoteCache();
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
    // 房间停摆冷启动
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

    const cfg = getCreepBodyByRole(role, room.energyCapacityAvailable);
    let body = [];
    Object.keys(cfg || {}).forEach(b => {
        body = body.concat(new Array(cfg[b]).fill(b));
    });
    return body;
}
// 生产单位执行
export function spawnCreep(room: Room, role: role_name_key, mem?: any, outer?: boolean) {
    let k = Memory.creeps_spawn_index || 0;
    if (typeof k !== 'number') {
        k = 0;
    }
    const che = getCache(room);
    if (outer) {
        // 优先执行正常安排的生产,外部生产空闲时处理
        if (che.c_energy_stop || che.c_spawn_fail_tick > max_fail_tick) {
            return;
        }
        if (che.c_spawning_role) {
            return;
        }
    }
    w_utils.update_cache(room.name, { spawning_role: role } as CacheGlobalRoom);
    const body = getCreepBody(room, role);
    if (!body){
        return console.log('spawnCreep err 90')
    }
    const cost = getBodyCost(body);
    const index = getCreepIndex();
    const name = `${role}_${index}`;
    const spawns: StructureSpawn[] = room.findBy(
        FIND_STRUCTURES,
        t => t.structureType === STRUCTURE_SPAWN
    ) as any;
    if (spawns.length) {
        const spawn: StructureSpawn = spawns.find(s => !s.spawning) as StructureSpawn;
        if (!spawn) {
            return;
        }
        const gems = Object.assign({ role: role, index: index, cost: cost, from: room.name }, mem);
        const act = spawn.spawnCreep(body, name, {
            memory: gems,
        });
        if (act === OK) {
            che.c_spawning_role = '';
            che.c_spawn_fail_tick = 0;
            Memory.creeps_spawn_index = k + 1;
            w_utils.update_cache(room.name, { spawning_role: '' } as CacheGlobalRoom);
        } else {
            che.c_spawning_role = role;
            che.c_spawn_fail_tick++;
            const { energyAvailable: eng, energyCapacityAvailable: cap } = room;
            const msg = `${spawn} ${name} ${w_utils.get_code_msg(
                act
            )}  need/current/total ${cost}/${eng}/${cap}`;
            console.log(room.name);
            console.log(msg);
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
        // 冷启动
        return spawnCreep(room, role);
    }
    role = getSpawnRole(room);
    if (role) {
        // 按计划安排
        return spawnCreep(room, role);
    }
    role = getRefreshRole(room);
    if (role) {
        // 刷新即将耗尽的单位
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
    const sh: RemoteReserve = w_cache.get(w_code.REMOTE_KEY_RESERVE);
    const ch: RemoteTransport = w_cache.get(w_code.REMOTE_KEY_TRANSPORT);
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
    while (target && target.role === w_role_name.remote_reserve && sh.stop_spawn_reserve(room)) {
        target = list.shift();
    }
    while (target && target.role === w_role_name.remote_carry && ch.stop_spawn(room)) {
        target = list.shift();
    }
    return target?.role;
}

function check_creep_timeout(creep: Creep, room?: Room) {
    let che = getCache(room || creep.room);
    if (che.c_refresh_creep[creep.id]) {
        return;
    }
    const body_length = creep.body.length;
    let remain = body_length * 3 + spawn_before_die;
    if (creep.memory.role.includes('remote')) {
        // 外矿预留时间加长
        remain += 50;
    }
    const timeout = creep.ticksToLive < remain;
    if (timeout) {
        che.c_refresh_creep[creep.id] = {
            role: creep.memory.role,
            id: creep.id,
            progress: false,
            life: creep.ticksToLive,
        };
    }
}
// 准备缓存
function prepareCache(room: Room) {
    let che = getCache(room);
    che.c_energy.push(room.energyAvailable);
    let c_ng = che.c_energy;
    che.c_energy_stop =
        c_ng.length > max_fail_tick - 20 && c_ng.every(e => e === undefined || e <= 300);
    cache[room.name] = che;
    return che;
}
// 检查外矿缓存
function prepareRemoteCache() {
    run_creep(undefined, function (creep) {
        const from_room = Game.rooms[creep.memory.from];
        let che = getCache(from_room);
        che.c_roles_count[creep.memory.role] += 1;
        check_creep_timeout(creep, from_room);
        cache[from_room.name] = che;
    });
}

// 获取缓存
function getCache(room: Room): RoomCache {
    if (!cache) {
        cache = {};
    }
    let che;
    che = cache[room.name];
    if (!che) {
        che = {
            c_energy_stop: false,
            c_roles_count: {},
            c_spawn_fail_tick: 0,
            c_energy: new ListA<number>(30),
            c_spawn_code: null,
            c_spawning_role: '',
            c_refresh_creep: {},
            c_tick: Game.time,
        };

        Object.values(w_role_name).forEach(k => {
            che.c_roles_count[k] = 0;
        });
    }
    if (che.c_tick !== Game.time) {
        Object.keys(che.c_roles_count).forEach(role => {
            che.c_roles_count[role] = 0;
        });
    }
    che.c_tick = Game.time;
    cache[room.name] = che;
    return che;
}
// 检查当前房间的状况来生成单位
function getRoleBoost(room: Room): role_name_key | undefined {
    const che = getCache(room);
    const current_exist = che.c_roles_count;
    const current_harvester = current_exist[w_role_name.harvester];
    const current_carrier = current_exist[w_role_name.carrier];
    const cfg = w_config.rooms[room.name];
    if (
        che.c_roles_count[w_role_name.harvester] === 0 &&
        che.c_roles_count[w_role_name.carrier] === 0 &&
        che.c_roles_count[w_role_name.starter] === 0
    ) {
        return w_role_name.starter;
    }
    if (current_exist.starter < cfg.creep_cfg_num.starter) {
        return w_role_name.starter;
    }
    if (current_carrier < 1) {
        return w_role_name.carrier;
    }
    if (current_harvester < 1) {
        return w_role_name.harvester;
    }
    if (current_carrier < 2) {
        return w_role_name.carrier;
    }
    if (current_harvester < 2) {
        return w_role_name.harvester;
    }
}
