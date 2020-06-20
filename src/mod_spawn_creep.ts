import { getBodyCost, ListA, run_my_room } from './lib_base';
import { getCreepBodyByRole } from './lib_creep';
import { RemoteTransport } from './mod_remote_transport';
import { RemoteReserveW } from './mod_remote_reserve';

interface CacheRoom {
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
    c_wait_role: SpawnTask[];
    c_tick: number;
    c_spawning: boolean;
    c_spawn_ids: string[];
}
interface SpawnTask {
    role: string;
    room?: string;
    memory?: any;
}
export class SpawnAuto {
    private last_run_time = 0;
    private last_update_time = 0;
    private run_tick = 9;
    private max_fail_tick = this.run_tick * 10;
    private spawn_before_tick = 30;
    private timeoutMap = new Map();
    // 房间缓存数据
    private cache_room: Map<string, CacheRoom> = new Map<string, CacheRoom>();
    private getRoomCache = (room: Room) => {
        let che = this.cache_room.get(room.name);
        if (!che) {
            che = {
                c_energy_stop: false,
                c_roles_count: {},
                c_spawn_fail_tick: 0,
                c_energy: new ListA<number>(4),
                c_spawn_code: null,
                // 生产的单位 一直等到能量足够
                c_spawning_role: '',
                c_wait_role: [],
                c_tick: 0,
                // 正在生产
                c_spawning: true,
                c_spawn_ids: room.findBy(FIND_MY_SPAWNS).map(t => t.id),
            };
            this.cache_room.set(room.name, che);
        }
        if (che.c_tick !== Game.time) {
            Object.keys(w_role_name).forEach(role => {
                che.c_roles_count[role] = 0;
            });
        }
        che.c_tick = Game.time;
        return che;
    };
    private getCreepBody = (room: Room, role: role_name_key) => {
        let che = this.getRoomCache(room);
        let a = che.c_roles_count[w_role_name.carrier] < 1;
        let b = che.c_roles_count[w_role_name.harvester] < 1;
        // 房间停摆冷启动
        if (a || b) {
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
    };
    public spawnCreep = (spawn: StructureSpawn, role: role_name_key, mem?: any) => {
        let k = Memory.creeps_spawn_index || 0;
        let room = spawn.room;
        if (typeof k !== 'number') {
            k = 0;
        }
        const che = this.getRoomCache(spawn.room);
        const body = this.getCreepBody(spawn.room, role);
        if (!body || body.length === 0) {
            g_log('spawn body empty');
            return;
        }
        const cost = getBodyCost(body);
        const name = `${role}_${k}`;
        const gems = Object.assign({ role: role, index: k, cost: cost, from: room.name }, mem);
        spawn.room.memory.spawning_role = role;
        spawn.memory.spawning_role = role;
        const act = spawn.spawnCreep(body, name, {
            memory: gems,
        });
        if (act === OK) {
            che.c_spawn_fail_tick = 0;
            Memory.creeps_spawn_index = k + 1;
            room.memory.spawning_role = '';
            spawn.memory.spawning_role = '';
        } else {
            che.c_spawn_fail_tick++;
            const { energyAvailable: eng, energyCapacityAvailable: cap } = room;
            const msg = `${room.name} spawn ${name} ${w_utils.get_code_msg(
                act
            )}  ${cost}/${eng}/${cap}`;
            g_log(msg);
        }
        che.c_spawn_code = act;
    };
    private trySpawnCreep = (room: Room, role: string, mem?: any) => {
        if (room.memory.spawning_role) {
            g_log(`${room.name} spawn ${role} fail, busy`);
            return;
        }
        const che = this.getRoomCache(room);
        const spawn = che.c_spawn_ids
            .map(id => Game.getObjectById<StructureSpawn>(id))
            .find(s => !s.spawning);
        if (spawn) {
            return this.spawnCreep(spawn, role, mem);
        }
    };
    private trySpawnCreepForce = (room: Room, role: string, mem?: any) => {
        const che = this.getRoomCache(room);
        const spawn = che.c_spawn_ids
            .map(id => Game.getObjectById<StructureSpawn>(id))
            .find(s => s && !s.spawning);
        if (spawn) {
            return this.spawnCreep(spawn, role, mem);
        }
    };
    private checkSpawnCreep = (room: Room) => {
        let role = room.memory.spawning_role;
        if (role) {
            return this.trySpawnCreepForce(room, role);
        }
        role = this.tryGetBoostRole(room);
        if (role) {
            return this.trySpawnCreepForce(room, role);
        }
        role = this.tryGetConfigRole(room);
        if (role) {
            return this.trySpawnCreepForce(room, role);
        }
        role = this.tryGetTimeoutRole(room);
        if (role) {
            return this.trySpawnCreepForce(room, role);
        }
    };
    // 检查是否满足发展
    private tryGetBoostRole = (room: Room) => {
        const che = this.getRoomCache(room);
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
    };
    // 检查是否满足配置
    private tryGetConfigRole = (room: Room) => {
        const sh: RemoteReserveW = w_cache.get('remote_ser_h');
        const ch: RemoteTransport = w_cache.get(w_code.remote_transport);
        const current_exist = this.getRoomCache(room).c_roles_count;
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
        let { remote_carry, remote_reserve } = w_role_name;
        while (target && target.role === remote_reserve && sh.stop_spawn_reserve(room)) {
            target = list.shift();
        }
        while (target && target.role === remote_carry && ch.stop_spawn_carry(room)) {
            target = list.shift();
        }
        return target?.role;
    };
    // 检查即将耗尽的单位
    private tryGetTimeoutRole = (room?: Room) => {
        const cps = Object.values(Game.creeps);
        for (let i = 0; i < cps.length; i++) {
            const creep = cps[i];
            if (creep.memory.from !== room.name) {
                continue;
            }
            if (this.timeoutMap.get(creep.id)) {
                continue;
            }
            room = room || creep.room;
            let role = creep.memory.role;
            const current_exist = this.getRoomCache(room).c_roles_count;
            const cfg = w_config.rooms[room.name].creep_cfg_num;
            // 数量超过配置的不生产
            if (current_exist[role] > (cfg[role] || 0)) {
                continue;
            }
            const body_length = creep.body.length;
            let remain = body_length * 3 + this.spawn_before_tick;
            if (creep.memory.role.includes('remote')) {
                // 外矿预留时间额外加40
                remain += 40;
            }
            if (
                [w_role_name.remote_reserve, w_role_name.remote_harvester].includes(
                    creep.memory.role
                )
            ) {
                // reserve harvest 额外加 40
                remain += 40;
            }
            if (creep.ticksToLive < remain) {
                this.timeoutMap.set(creep.id, true);
                return creep.memory.role;
            }
        }
    };
    public updateState = () => {
        if (this.last_update_time === Game.time) {
            return;
        }
        this.last_update_time = Game.time;
        run_my_room(room => {
            let che = this.getRoomCache(room);
            che.c_energy.push(room.energyAvailable);
            let c_ng = che.c_energy;
            che.c_energy_stop = c_ng.length > 6 && c_ng.every(e => e === undefined || e <= 300);
        });
        Object.values(Game.creeps).forEach(creep => {
            const from_room = Game.rooms[creep.memory.from];
            let che = this.getRoomCache(from_room);
            che.c_roles_count[creep.memory.role] += 1;
        });
    };
    private tryUpdateState = () => {
        this.updateState();

        if (Game.time - this.last_update_time > 30) {
            this.last_update_time = Game.time;
            // this.updateState();
        }
    };
    // 主方法 每 tick 调用一次
    public run = (force?: boolean) => {
        if (this.last_run_time === Game.time) {
            return;
        }
        this.last_run_time = Game.time;
        this.tryUpdateState();
        run_my_room(room => {
            this.checkSpawnCreep(room);
        });
    };
    public static spawnCreep = (room: Room, role: role_name_key, mem?: any) => {
        let driver: SpawnAuto = w_cache.get(SpawnAuto.cache_key);
        if (!driver) {
            driver = new SpawnAuto();
            w_cache.set(SpawnAuto.cache_key, driver);
        }
        driver.run(true);
        driver.trySpawnCreep(room, role, mem);
    };
    public static cache_key = w_code.DRIVER_KEY_SPAWN_AUTO;
    public static start = () => {
        let driver: SpawnAuto = w_cache.get(SpawnAuto.cache_key);
        if (!driver) {
            driver = new SpawnAuto();
            w_cache.set(SpawnAuto.cache_key, driver);
        }
        driver.run();
    };
}
let driver: SpawnAuto = w_cache.get(SpawnAuto.cache_key);
if (!driver) {
    driver = new SpawnAuto();
    w_cache.set(SpawnAuto.cache_key, driver);
}
global.G_SpawnAuto = SpawnAuto;
