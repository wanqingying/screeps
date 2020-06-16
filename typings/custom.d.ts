//MOVE 50
//WORK 100
//CARRY 50
//ATTACK 80
//RANGED_ATTACK 150
//HEAL 250
//CLAIM 600
//TOUGH 10

declare type role_name_key =
    | 'carrier'
    | 'remote_carry'
    | 'remote_attack'
    | 'harvester'
    | 'remote_harvester'
    | 'remote_reserve'
    | 'starter'
    | 'upgrader'
    | 'builder'
    | 'scout'
    | 'claim'
    | 'repair'
    | 'attack'
    | 'heal'
    | string;

declare interface SourceCache {
    source: Source;
    // 开采速度,等于 work*2
    speed?: number;
    container: StructureContainer;
    // 矿边上的容器余量，用于搬运单位选择目标,初始为0
    containerCap: number;
}

declare interface StructureHasStore extends Structure<any> {
    store: Store<any, any>;
}

declare interface RoomCreepCfg {
    [role: string]: {
        max: number;
    };
}

declare type FindPropertyConstant = 'structureType' | 'id' | 'name';

declare class ListA<T> {
    private array: T[];
    private usage: number;
    public readonly length: number;
    constructor(length: number);
    public push(unit: T): number;
    public filter<T>(
        callback: (value: T, index: number, array: T[]) => value is T,
        thisArg?: any
    ): T[];
    public every: typeof Array.prototype.every;
}
