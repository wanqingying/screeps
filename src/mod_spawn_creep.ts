import { getBodyCost, ListA, RemoteReserve, RemoteTransport, run_my_room } from './lib_base';
import { getCreepBodyByRole } from './lib_creep';

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
    // 生产期间禁止新的任务加入
    c_ready: boolean;
}
interface SpawnTask {
    role: string;
    room?: string;
    memory?: any;
}
export class SpawnAuto {
    private last_run_time = 0;
    private last_update_time = 0;
    private run_tick = 6;
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
                c_spawning_role: '',
                c_wait_role: [],
                c_tick: 0,
                c_spawning: true,
                c_ready: true,
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
    private getCreepBody= (room: Room, role: role_name_key)=> {
        let che = this.getRoomCache(room);
        let a = che.c_roles_count[w_role_name.carrier] < 1;
        let b = che.c_roles_count[w_role_name.harvester] < 1;
        console.log('get body',room.name);
        console.log(a,b);
        console.log(JSON.stringify(che.c_roles_count));
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
    }
    constructor() {}
    public spawnCreep = (room: Room, role: role_name_key, mem?: any) => {
        let k = Memory.creeps_spawn_index || 0;
        if (typeof k !== 'number') {
            k = 0;
        }
        const che = this.getRoomCache(room);
        che.c_ready = false;
        const body = this.getCreepBody(room, role);
        if (!body) {
            return;
        }
        const cost = getBodyCost(body);
        const index = Memory.creeps_spawn_index;
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
            const gems = Object.assign(
                { role: role, index: index, cost: cost, from: room.name },
                mem
            );
            room.memory.spawning_role = role;
            const act = spawn.spawnCreep(body, name, {
                memory: gems,
            });
            if (act === OK) {
                che.c_spawn_fail_tick = 0;
                Memory.creeps_spawn_index = k + 1;
                che.c_spawning_role = '';
            } else {
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
    };
    private checkSpawnCreep = (room: Room) => {
        let che = this.getRoomCache(room);
        // if (che.c_energy_stop || che.c_spawn_fail_tick > this.max_fail_tick) {
        //     return;
        // }
        let role = che.c_spawning_role;
        let mem = {};
        if (!role) {
            let next = che.c_wait_role.shift();
            if (next) {
                role = next.role;
                room.memory.spawning_role = role;
                mem = next.memory;
            }
        }
        if (role) {
            this.spawnCreep(room, role, mem);
        }
    };
    private addSpawnTask = (room: Room, task: SpawnTask) => {
        const che = this.getRoomCache(room);
        let b = che.c_wait_role.every(t => t.role !== task.role);
        if (b && che.c_ready) {
            che.c_wait_role.push(task);
            return true;
        }
        return false;
    };
    private updateRoleBoost = (room: Room) => {
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
            return this.addSpawnTask(room, { room: room.name, role: w_role_name.starter });
        }
        if (current_exist.starter < cfg.creep_cfg_num.starter) {
            return this.addSpawnTask(room, { room: room.name, role: w_role_name.starter });
        }
        if (current_carrier < 1) {
            return this.addSpawnTask(room, { room: room.name, role: w_role_name.carrier });
        }
        if (current_harvester < 1) {
            return this.addSpawnTask(room, { room: room.name, role: w_role_name.harvester });
        }
        if (current_carrier < 2) {
            return this.addSpawnTask(room, { room: room.name, role: w_role_name.carrier });
        }
        if (current_harvester < 2) {
            return this.addSpawnTask(room, { room: room.name, role: w_role_name.harvester });
        }
    };
    private updateRoleConfig = (room: Room) => {
        const sh: RemoteReserve = w_cache.get(w_code.REMOTE_KEY_RESERVE);
        const ch: RemoteTransport = w_cache.get(w_code.REMOTE_KEY_TRANSPORT);
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
        if (target?.role) {
            this.addSpawnTask(room, { role: target.role });
        }
    };
    // 检查即将耗尽的单位 30tick 执行一次
    public check_timeout_creep = (creep: Creep, room?: Room) => {
        if (this.timeoutMap.get(creep.id)) {
            return;
        }
        room = room || creep.room;
        let role = creep.memory.role;
        const current_exist = this.getRoomCache(room).c_roles_count;
        const cfg = w_config.rooms[room.name].creep_cfg_num;
        if (current_exist[role] > cfg[role]) {
            return;
        }
        const body_length = creep.body.length;
        let remain = body_length * 3 + this.spawn_before_tick;
        if (creep.memory.role.includes('remote')) {
            // 外矿预留时间加长
            remain += 50;
        }
        if (creep.ticksToLive < remain) {
            let res = this.addSpawnTask(room, { role: creep.memory.role, memory: {} });
            if (res) {
                this.timeoutMap.set(creep.id, true);
            }
        }
    };
    // 每次 tick
    public updateState = () => {
        this.last_update_time = Game.time;
        run_my_room(room => {
            let che = this.getRoomCache(room);
            che.c_energy.push(room.energyAvailable);
            let c_ng = che.c_energy;
            che.c_energy_stop = c_ng.length > 6 && c_ng.every(e => e === undefined || e <= 300);
            let no_sp = room.find(FIND_MY_SPAWNS).every(s => !s.spawning);
            if (no_sp) {
                che.c_ready = true;
            }
        });
        Object.values(Game.creeps).forEach(creep => {
            const from_room = Game.rooms[creep.memory.from];
            let che = this.getRoomCache(from_room);
            che.c_roles_count[creep.memory.role] += 1;
        });
        Object.values(Game.creeps).forEach(creep => {
            const from_room = Game.rooms[creep.memory.from];
            this.check_timeout_creep(creep, from_room);
        });

        run_my_room(room => {
            this.updateRoleBoost(room);
            this.updateRoleConfig(room);
        });
    };
    // 主方法 每 tick 调用一次
    public run = (force?: boolean) => {
        if (this.last_run_time === Game.time) {
            return;
        }
        if (!force && Game.time - this.last_run_time < this.run_tick) {
            return;
        }
        this.last_run_time = Game.time;
        this.updateState();
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
        driver.addSpawnTask(room, { role: role, memory: mem });
        driver.run(true);
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
