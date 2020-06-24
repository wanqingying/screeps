declare interface DropResource {
    resource: Resource;
    // 初始=0
    cap: number;
}
declare interface Room {
    sourceInfo: SourceCache[];
    energyStop: boolean;
    energy_lack_tick: 50;
    // 维护掉在地上的垃圾队列，用于carrier捡垃圾策略 cap:有多少空间被预定
    dropResources: DropResource[];
    findBy<K extends FindConstant>(type: K, filter?: FilterFunction<K>): Array<FindTypes[K]>;
    findByFilter<K extends FindConstant>(
        type: K,
        property?: FindPropertyConstant,
        propertyIn?: any[],
        filter?: FilterFunction<K>
    ): Array<FindTypes[K]>;
    findByCacheKey<K extends FindConstant>(
        type: K,
        property?: FindPropertyConstant,
        propertyIn?: any[]
    ): Array<FindTypes[K]>;
    log(...p: any): void;
    start(): void;
}

declare interface RoomPosition {
    inRangeToPos(pos: RoomPosition, range?: number): boolean;
}
