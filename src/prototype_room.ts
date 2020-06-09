import { find_nearby_target, ListA } from './lib_base';
import { checkCreep } from './prototype_room_spawn';

Room.prototype.start = function () {
    const room = this;
    refresh(room);
    refreshDropEnergy(room);
    refreshMaxCreepCount(room)
    checkTower(room);
    checkCreep(room);
};
Room.prototype.findBy = function (type, filter) {
    return this.find(type, { filter });
};

function refresh(room: Room) {
    refreshData(room);
    refreshEnergyData(room);
    refreshHotData(room);
    prepareMemory(room);
}

function checkTower(room: Room) {
    const towers = room.findBy(
        FIND_STRUCTURES,
        t => t.structureType === STRUCTURE_TOWER
    ) as StructureTower[];
    for (let i = 0; i < towers.length; i++) {
        const tower = towers[i];
        const targetHeal = findHealTarget(room);
        if (targetHeal) {
            tower.heal(targetHeal);
            continue;
        }
        const targetRepair = findRepairTarget(room);
        if (targetRepair) {
            tower.repair(targetRepair);
            continue;
        }
        const targetAttack = findTargetAttack(room);
        if (targetAttack) {
            tower.attack(targetAttack);
            continue;
        }
        room.log('tower no target');
    }
}
function findHealTarget(room: Room): AnyCreep {
    return room
        .findBy(FIND_CREEPS, t => t.hits < t.hitsMax)
        .sort((a, b) => {
            return a.hits - b.hits;
        })[0];
}
function findRepairTarget(room: Room): AnyStructure {
    return room
        .findBy(FIND_STRUCTURES, t => t.hits < t.hitsMax)
        .sort((a, b) => {
            return a.hits - b.hits;
        })[0];
}
function findSourceMinHarvester(room: Room) {}
function findTargetAttack(room: Room) {
    return null;
}
Room.prototype.findByFilter = function (type, property, propertyIn, filter) {
    const room = this;
    const res = room.findByCacheKey(type, property, propertyIn);
    if (filter) {
        return res.filter(filter);
    } else {
        return res;
    }
};
Room.prototype.findByCacheKey = function (type, property, propertyIn = []) {
    const room = this;
    const key = `${room.name}_${type}_${property || ''}_${propertyIn.join('#')}`;
    const cache_res = w_cache.get(key);
    let res: any[];
    // if (cache_res) {
    //     res = cache_res;
    // }
    const opt = { filter: undefined };
    if (property) {
        opt.filter = item => {
            const value = item[property];
            return propertyIn.includes(value);
        };
    }
    res = room.find(type, opt);
    w_cache.set(key, res);
    return res;
};
// 初始化每 tik 都需要更新的数据
function refreshHotData(room: Room) {
    room.log(`energy ${room.energyAvailable}/${room.energyCapacityAvailable}`);
    // 初始化角色
    const creepsIn = room.findByFilter(FIND_CREEPS);
    room.roleExist = {} as any;
    room.creepCount = creepsIn.length;
    Object.values(w_role_name).forEach(role => {
        const exists = creepsIn.filter(c => c.memory?.role === role);
        room.roleExist[role] = exists.length;
    });
    // 初始化基地
    room.spawns = room.findByFilter(FIND_STRUCTURES, 'structureType', [
        STRUCTURE_SPAWN,
    ]) as StructureSpawn[];
    // 初始化可开采能量资源
    room.sourceInfo = [];
    const creeps = Object.values(Game.creeps);
    const containers = room.findBy(FIND_STRUCTURES, t => t.structureType === STRUCTURE_CONTAINER);
    room.find(FIND_SOURCES).forEach(source => {
        const target_creeps = creeps
            .map(creep => {
                if (creep.memory?.target_resource_id === source.id) {
                    return creep;
                }
            })
            .filter(k => k && k.name);
        const near = find_nearby_target(source, containers) as StructureContainer;
        const far = count_distance(near?.pos, source?.pos);
        let speed = 0;
        target_creeps.forEach(a => {
            a.body.forEach(b => {
                if (b.type === WORK) {
                    speed += 2;
                }
            });
        });
        if (far === 1) {
            room.sourceInfo.push({
                source: source,
                container: near,
                harvesters: target_creeps,
                speed: 0,
            });
        } else {
            room.sourceInfo.push({
                source: source,
                harvesters: target_creeps,
                speed: speed,
                container: undefined,
            });
        }
    });
    // 初始化房间状态
    room.spawning = room.spawns.some(s => s.spawning);
}
function refreshEnergyData(room) {
    const n = 10;
    // 初始化能量资源状况
    let state = global.w_rooms.get(room.name);
    if (!state) {
        state = { energyCount: new ListA<number>(n), energyRate: new ListA<number>(n) } as any;
        global.w_rooms.set(room.name, state);
    }
    const { energyAvailable, energyCapacityAvailable } = room;
    const rate = energyAvailable / energyCapacityAvailable;
    state.energyRate.push(rate);
    state.energyCount.push(energyAvailable);
    if (state.energyCount.length > 20) {
        room.energyStop = state.energyCount.every(r => r <= 300) && energyCapacityAvailable > 300;
    }
    if (state.energyRate.length > 20) {
        const rates = state.energyRate;
        room.memory.energyLack =
            rates.every(rt => rt < w_config.energy_lack_rate) && rates.length > 10;
        room.energyFull = rates.every(r => r > 0.99);
    }
}
// 刷新半持久数据
function refreshData(room) {
    // const che = room.getRoomCache()
    if (!room.refreshTick) {
        room.refreshTick = 0;
    }
    if (Game.time - room.refreshTick < 100) {
        return;
    }
    if (!room.energyExist) {
        room.energyExist = {};
    }
}
function prepareMemory(room: Room) {
    // 初始化房间数据
    if (!room.memory.renew_count) {
        room.memory.renew_count = 0;
    }
}
Room.prototype.getRoomCache = function () {
    const room = this;
    let che = w_rooms.get(room.name);
    let n = 50;
    if (!che) {
        che = {
            energyCount: new ListA<number>(n) as any,
            energyRate: new ListA<number>(n) as any,
            spawnCode: -333,
            spawnFailTick: 0,
            spawnIndex: 0,
            sources: [],
        };
    }
    if (typeof che.spawnIndex !== 'number') {
        che.spawnIndex = 0;
    }
    if (typeof che.spawnFailTick !== 'number') {
        che.spawnFailTick = 0;
    }
    if (!Array.isArray(che.sources)) {
        che.sources = [];
    }
    if (!che.energyCount) {
        che.energyCount = new ListA<number>(n) as any;
    }
    if (!che.energyRate) {
        che.energyRate = new ListA<number>(n) as any;
    }
    w_rooms.set(room.name, che);
    return che;
};
function refreshDropEnergy(room: Room) {
    room.dropResources = room.find(FIND_DROPPED_RESOURCES).map(d => {
        return {
            resource: d,
            cap: 0,
        };
    });
}

Room.prototype.checkSources = function () {
    const room = this;
    const sources = room.sourceInfo;
};

function refreshMaxCreepCount(room: Room) {
    const cfg = w_config.creep_cfg_num;
    let k = 0;
    Object.values(cfg).forEach(n => (k = k + n));
    room.maxCreepCount=k;
}
