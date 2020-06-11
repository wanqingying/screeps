export function find_source_min_harvester(room: Room) {
    return room.sourceInfo.sort((a, b) => {
        return a.harvesters.length - b.harvesters.length;
    })[0];
}

export function checkRenewCount(room: Room) {
    room.memory.renew_count = room.findBy(FIND_CREEPS, c => c.memory?.renew).length;
}

// 房间生成单位时不允许
export function f() {}
