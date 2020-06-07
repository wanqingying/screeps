export function find_nearby_target(base, targets): RoomPosition {
    const c = base.pos || base;
    const tt=targets.sort((a, b) => {
        return count_distance(c, a.pos || a) - count_distance(c, b.pos || b);
    })
    const target = tt.shift()

    return  target;
}
