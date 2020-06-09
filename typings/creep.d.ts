declare interface Creep {
    // renew 持续时间 过长则停止
    renewTime: number;
    getRenewFailTime(): number;
    increaseRenewFailTime();
    resetRenewFailTime(): void;
    log(...p: any): void;
    run(): void;
    prepare(): void;
    // 自杀/更新换代
    refresh(): void;
    getCache(): CacheCreep;
    findSourceHarvester(): Source;
    harvestSource(): boolean;
    moveToTarget(target: RoomPosition): ScreepsReturnCode;
    findAndMoveToSourcePos(target: Source): ScreepsReturnCode;
    findSource(): SourceCache | undefined;
    isEmpty(type?: ResourceConstant): boolean;
    isFull(type?: ResourceConstant): boolean;
}
