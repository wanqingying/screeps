
Spawn.prototype.runTask = function () {
    const spawn: StructureSpawn = this;
    spawn.memory.tasks = [];
};

export function getPossibleMaxEnergy(room: Room): number {
    let max = 0;
    room.memory.energyExist.forEach(n => {
        if (n > max) {
            max = n;
        }
    });
    return max;
}
