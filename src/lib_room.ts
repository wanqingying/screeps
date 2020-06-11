export function find_source_min_harvester(room: Room) {
    return room.sourceInfo.sort((a, b) => {
        return a.harvesters.length - b.harvesters.length;
    })[0];
}

export function checkRenewCount(room: Room) {
    room.memory.renew_count = room.findBy(FIND_CREEPS, c => c.memory?.renew).length;
}

// 房间是否可以开外矿
export function canReservation(room: Room): boolean {
    if (room.controller) {
        return false;
    }
    if (room.controller.owner.username) {
        return false;
    }
    if (!room.controller.reservation.username) {
        return true;
    }
    return room.controller.reservation.username === w_my_name;
}
