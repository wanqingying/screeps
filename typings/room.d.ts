declare interface Room {
    sourceInfo: Source_h[];
    // 当前的角色数量信息
    roleExist: RoleExist;
    // 引用对象
    spawns: StructureSpawn[];
    // 单位数量
    creepCount: number;
    // 存在需要生产的单位
    spawning: boolean;
    // 是否持续 n tik 缺能量
    energyLack: boolean;
    // 是否持续 n tik 没有能量收入
    energyStop: boolean;
    energy_lack_tick: 50;
    // 是否持续 10 tik 能量达到上限
    energyFull: boolean;
    // 过去 n tik 的饱和度
    energyRate: ListA<number>;
    // 过去 n tik 的存量
    energyExist: ListA<number>;
    // 上一次更新半持久化数据的时间
    refreshTick: number;
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
    // 初始化持久化数据
    prepareMemory(): void;
    checkTower(): void;
    findTargetHeal(): any;
    findTargetRepair(): any;
    findTargetAttack(): any;
    findSourceMinHarvester(): any;
    checkSpawnCreep(): any;
}
