function findBy<T>() {}

Room.prototype.findBy = function (type, filter) {
    return this.find(type, { filter });
};
