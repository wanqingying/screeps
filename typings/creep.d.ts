declare interface Creep {
    // renew 持续时间 过长则停止
    renewTime: number;
    getRenewTime(): number;
    increaseRenewTime();
    log(...p: any): void;
    run(): void;
    prepare(): void;
    // 自杀/更新换代
    refresh(): void;
    getCache(): CacheCreep;
    pickUpEnergyFromMine(): boolean;
}
