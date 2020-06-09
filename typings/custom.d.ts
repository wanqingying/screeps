//MOVE 50
//WORK 100
//CARRY 50
//ATTACK 80
//RANGED_ATTACK 150
//HEAL 250
//CLAIM 600
//TOUGH 10

declare type role_name_key = 'carrier' | 'harvester' | 'starter' | 'upgrader' | 'builder' | string;

declare interface SourceCache {
    source: Source;
    harvesters: Creep[];
    // 开采速度,等于 work*2
    speed?: number;
    container: StructureContainer;
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
