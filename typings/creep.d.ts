declare interface Creep {
    // renew 持续时间 过长则停止
    renewTime: number;
    // spawn cost
    cost: number;
    log(...p: any): void;
    log_one(...p: any): void;
    say_one(...p: any): void;
    run(): void;
    prepare(): void;
    // 自杀/更新换代
    refresh(): void;
    getCache(): CacheCreep;
    findSourceHarvester(): Source;
    findAndMoveToSourcePos(target: Source): ScreepsReturnCode;
}
