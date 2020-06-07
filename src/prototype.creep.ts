Creep.prototype.pick_up_max_drop = function (target: Resource) {
    return false;
};

Creep.prototype.run = function () {
    const role = this.memory.role;
    const runner = this[`run_${role}`] as role_run_fn;
    return runner.call(this);
};

Creep.prototype.run_starter = function () {
    let creep = this;
    let freeCap = this.store.getFreeCapacity();
    let process = this.memory.process;
    let room = this.room;
    freeCap === 0 && (this.memory.process = 'drop');
    if (freeCap > 0 && process !== 'drop') {
        // 有空间且不在卸货状态
        let target = room.source_energy
            .sort((a, b) => {
                return a.harvester.length - b.harvester.length;
            })
            .shift();
        if (!target) {
            return this.log('source not found');
        }
        target.harvester.push(this.name);
        let act=this.harvest(target.target)
        if (act===ERR_NOT_IN_RANGE) {
            this.moveTo(target.target);
        }
        if (act===OK){
            if (this.store.getFreeCapacity()===0){

            }
        }
    }
    if (process === 'drop') {
        // 卸货状态，直到写完
        const act = this.transfer_nearby();
        if (act && this.store.getUsedCapacity() === 0) {
            this.memory.process = 'dig';
        }
    }

    if (creep.store.getFreeCapacity() > 0 && creep.memory.process !== 'drop') {
        let target = Object.keys(Memory.resource_energy)
            .filter(k => {
                let g: Source = Game.getObjectById(k);
                return g && g.energy > 500;
            })
            .pop();
        if (target) {
            let g: Source = Game.getObjectById(target);
            if (creep.harvest(g) === ERR_NOT_IN_RANGE) {
                creep.moveTo(g);
            }
        }
    } else {
        creep.memory.process = 'drop';
        if (transferNearby(creep)) {
            if (creep.store.getUsedCapacity() === 0) {
                creep.memory.process = 'dig';
            }
        }
    }
};

Creep.prototype.transfer_nearby = function () {
    return false;
};
