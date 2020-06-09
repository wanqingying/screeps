// 不能引用其他模块

export function find_nearby_target<T>(base, targets:T[]): T {
    const c = base.pos || base;
    const tt = targets.sort((a, b) => {
        // @ts-ignore
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
    public _get_array = () => this.array;
}

// 获取等级
export function getEnergyLevel(energyMax: number) {
    // 每等级扩展提供的数量 0-300=>1 300-550=>2
    const energy_ext = [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000];
    let min = 0;
    let max = 0;
    for (let i = 1; i < energy_ext.length; i++) {
        min = 300 + energy_ext[i - 1];
        max = 300 + energy_ext[i];
        if (min < energyMax && energyMax <= max) {
            return i;
        }
    }
}
