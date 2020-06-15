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
}
