import { ParamRoomFilter } from './lib_cache';

Room.prototype.findBy = function (type, filter) {
    return this.find(type, { filter });
};

Room.prototype.findByFilter = function (type, filter) {
    return this.find(type, { filter });
};

Room.prototype.refresh = function () {
    const room = this;
    room.refreshData();
    room.refreshEnergyData();
    room.refreshHotData();
};

Room.prototype.checkTower = function () {
    const room = this;
    const towers = room.findBy(
        FIND_STRUCTURES,
        t => t.structureType === STRUCTURE_TOWER
    ) as StructureTower[];
    for (let i = 0; i < towers.length; i++) {
        const tower = towers[i];
        const targetHeal = room.findTargetHeal(room);
        if (targetHeal) {
            tower.heal(targetHeal);
            continue;
        }
        const targetRepair = room.findTargetRepair(room);
        if (targetRepair) {
            tower.repair(targetRepair);
            continue;
        }
        const targetAttack = room.findTargetAttack(room);
        if (targetAttack) {
            tower.attack(targetAttack);
            continue;
        }
        room.log('tower no target');
    }
};
Room.prototype.findSourceMinHarvester = function () {
    const room = this;
};
Room.prototype.findTargetHeal = function () {
    const room = this;
};
Room.prototype.findTargetAttack = function () {
    const room = this;
};
Room.prototype.findTargetRepair = function () {
    const room = this;
};
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
    const cache_res = cache.get(key);
    let res: any[];
    if (cache_res) {
        res = cache_res;
    }
    res = room.find(type, {
        filter: item => {
            const value = item[property];
            return propertyIn.includes(value);
        },
    });
    cache.set(key, res);
    return res;
};

// 初始化每 tik 都需要更新的数据
Room.prototype.refreshHotData = function () {
    const room = this;
    room.log(`energy ${room.energyAvailable}/${room.energyCapacityAvailable}`);
    // 初始化角色
    const creepsIn = room.findByFilter(FIND_CREEPS);
    room.roleExist = {} as any;
    room.creepCount = creepsIn.length;
    Object.values(role_name).forEach(role => {
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
    room.find(FIND_SOURCES).forEach(source => {
        const cps = creeps
            .map(creep => {
                if (creep.memory?.target_resource_id === source.id) {
                    return creep;
                }
            })
            .filter(k => k && k.name);
        room.sourceInfo.push({ source: source, harvesters: cps });
    });
    // 初始化房间状态
    room.spawning = room.spawns.some(s => s.spawning);
};

Room.prototype.refreshEnergyData = function () {
    const room = this;
    const n=50;
    // 初始化能量资源状况
    let state = global.w_rooms.get(room.name);
    if (!state) {
        state = { energyCount: new ListA<number>(n), energyRate: new ListA<number>(n) };
        global.w_rooms.set(room.name, state);
    }
    const { energyAvailable, energyCapacityAvailable } = room;
    const rate = energyAvailable / energyCapacityAvailable;

    state.energyRate.push(rate);
    state.energyCount.push(energyAvailable);
    if (state.energyCount.length > 30) {
        room.energyStop = state.energyCount.every(r => r <= 300) && energyCapacityAvailable > 300;
    }
    if (state.energyRate.length > 30) {
        const rates = state.energyRate;
        room.memory.energyLack =
            rates.every(rt => rt < config.energy_lack_rate) && rates.length > 10;
        room.energyFull = rates.every(r => r > 0.99);
    }
};
// 刷新半持久数据
Room.prototype.refreshData = function () {
    const room = this;
    if (!room.refreshTick) {
        room.refreshTick = 0;
    }
    if (Game.time - room.refreshTick < 100) {
        return;
    }
    if (!room.energyExist) {
        room.energyExist = {};
    }
};

Room.prototype.prepareMemory = function () {
    const room = this;
    // 初始化房间数据
    if (!room.memory.renew_count) {
        room.memory.renew_count = 0;
    }
};
