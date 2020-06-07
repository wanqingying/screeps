export function find_nearby_target(base, targets): RoomPosition {
    const c = base.pos || base;
    const target = targets.sort((a, b) => {
        return count_distance(c, a.pos || a) - count_distance(c, b.pos || b);
    })[0];
    return target?.pos || target;
}

export function get_creep_config(room: Room) {
    const level = room.controller.level;
}
