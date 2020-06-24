Creep.prototype.gotoPos = function (pos, range) {
    if (this.pos.inRangeToPos(pos, range)) {
        return OK;
    } else {
        return this.moveTo(pos);
    }
};
