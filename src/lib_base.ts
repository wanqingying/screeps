export function find_nearby_target(base, targets): RoomPosition {
    const c = base.pos || base;
    const tt = targets.sort((a, b) => {
        return count_distance(c, a.pos || a) - count_distance(c, b.pos || b);
    });
    return tt.shift();
}

// 先进后出队列
export class ListA<T> {
    private readonly array: T[];
    private usage: number = 0;
    public readonly max: number;
    constructor(length: number) {
        this.array = new Array(length).fill(undefined);
        this.max = length;
    }
    public push(unit: T) {
        const res = this.array.push(unit);
        this.array.shift();
        this.usage++;
        return res;
    }
    public filter = f => this.array.filter(f);
    public every = f => this.array.every(f);
    public get length() {
        return Math.min(this.max, this.usage);
    }
}
