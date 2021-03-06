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
let pos: RoomPosition;
// RoomPosition.prototype.inRangeTo()

RoomPosition.prototype.inRangeToPos = function (pos: RoomPosition, range: number = 1) {
    if (pos.roomName !== this.roomName) {
        return false;
    }
    let dx = this.x - pos.x;
    dx = dx > 0 ? dx : 0 - dx;
    let dy = this.y - pos.y;
    dy = dy > 0 ? dy : 0 - dy;
    const far = Math.max(dx, dy);
    return far <= range;
};
