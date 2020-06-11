declare interface DropResource {
    resource: Resource;
    // 初始=0
    cap: number;
}
declare interface CacheRoom {
    energyCount: ListA<number>;
    spawnCode: any;
    spawnIndex: number;
    spawnFailTick: number;
    sources: SourceWithContainer[];
    stopKill: number;
}
declare interface Room {
    sourceInfo: SourceCache[];
    // 当前的角色数量信息
    roleExist: RoleExist;
    // 引用对象
    spawns: StructureSpawn[];
    // 单位数量
    creepCount: number;
    // 存在需要生产的单位
    spawning: boolean;
    energyStop: boolean;
    energy_lack_tick: 50;
    // 维护掉在地上的垃圾队列，用于carrier捡垃圾策略 cap:有多少空间被预定
    dropResources: DropResource[];
    maxCreepCount: number;
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
    refresh(): void;
    // 初始化每个 tic 都需要刷新的数据
    refreshHotData(): void;
    refreshEnergyData(): void;
    // 初始化半持久化的数据
    refreshData(): void;
    // 单位自杀更新换代  一次自杀一个
    refreshCreep(): void;
    // 杀死房间内多余的单位
    killMoreCreep(): void;
    // 初始化持久化数据
    prepareMemory(): void;
    // 维护单位
    checkCreep(): void;
    checkTower(): void;
    findTargetAttack(): any;
    findSourceMinHarvester(): any;
    checkSpawnCreep(): any;
    start(): void;
    getCache(): CacheRoom;
    refreshDropEnergy(): void;
}
