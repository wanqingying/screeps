import { findNearTarget } from './lib_base';

Room.prototype.start = function () {
    const room = this;
    refreshHotData(room);
    refreshDropEnergy(room);
};
Room.prototype.findBy = function (type, filter) {
    return this.find(type, { filter });
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
    let res: any[];
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
    // 初始化可开采能量资源
    room.sourceInfo = [];
    const containers = room.findBy(FIND_STRUCTURES, t => t.structureType === STRUCTURE_CONTAINER);
    room.find(FIND_SOURCES).forEach(source => {
        const near = findNearTarget(source, containers) as StructureContainer;
        const far = w_utils.count_distance(near?.pos, source?.pos);
        let info = {
            source: source,
            container: undefined,
            containerCap: 0,
            speed: 0,
        };
        if (far === 1 && near) {
            info.container = near;
            info.containerCap = 0;
        }
        room.sourceInfo.push(info);
    });
}

function refreshDropEnergy(room: Room) {
    room.dropResources = room.find(FIND_DROPPED_RESOURCES).map(d => {
        return {
            resource: d,
            cap: 0,
        };
    });
}
