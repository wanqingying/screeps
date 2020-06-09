// 不能引用其他模块

export function find_nearby_target<T>(base, targets: any[]): T {
    const c = base.pos || base;
    const tt = targets.sort((a, b) => {
        return w_utils.count_distance(c, a.pos || a) - w_utils.count_distance(c, b.pos || b);
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

export function getCreepBody(creep: Creep): { [type in BodyPartConstant]: number } {
    let body = {};
    creep.body.forEach(b => {
        let type = b.type;
        if (body[type]) {
            body[type]++;
        } else {
            body[type] = 1;
        }
    });
    return body as any;
}
export function getCreepBodyNum(creep: Creep, type: BodyPartConstant): number {
    let body = getCreepBody(creep);
    return body[type] || 0;
}
// carry ability
export function getCreepsCarry(creeps: Creep[]) {
    let carry = 0;
    creeps.forEach(creep => {
        if (creep.memory.role === 'carrier') {
            let bd = getCreepBody(creep);
            carry += getCreepBodyNum(creep, CARRY);
        }
    });
}

export function getCreepsRoleAbility(creeps: Creep[], role: role_name_key) {
    let carry = 0;
    let mine = 0;
    creeps.forEach(creep => {
        if (creep.memory.role === w_role_name.carrier) {
            carry += getCreepBodyNum(creep, CARRY);
        }
        if (creep.memory.role === w_role_name.harvester) {
            mine += getCreepBodyNum(creep, WORK);
        }
        if (creep.memory.role === w_role_name.starter) {
            carry += getCreepBodyNum(creep, CARRY) / 2;
            mine += getCreepBodyNum(creep, WORK) / 2;
        }
    });
    switch (role) {
        case w_role_name.harvester:
            return mine;
        case w_role_name.carrier:
            return carry;
        default:
            return 0;
    }
}

export function getBodyCost(body: BodyPartConstant[]) {
    let cost = 0;
    body.forEach(b => {
        cost += w_config.internal.body_cost[b];
    });
    return cost;
}

export function isEmpty(target: any, type?: ResourceConstant): boolean {
    return target?.store?.getUsedCapacity(type || RESOURCE_ENERGY) === 0;
}
export function isNotEmpty(target: any, type?: ResourceConstant): boolean {
    return target?.store?.getUsedCapacity(type || RESOURCE_ENERGY) > 0;
}
export function isNotFull(target: any, type?: ResourceConstant): boolean {
    return target?.store?.getFreeCapacity(type || RESOURCE_ENERGY) > 0;
}
export function isFull(target: any, type?: ResourceConstant): boolean {
    return target?.store?.getFreeCapacity(type || RESOURCE_ENERGY) === 0;
}
