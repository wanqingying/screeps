declare interface Creep {
    // renew 持续时间 过长则停止
    renewTime: number;
    // spawn cost
    cost: number;
    log(...p: any): void;
    log_one(...p: any): void;
    say_one(...p: any): void;
    run(): void;
    gotoPos(
        pos: RoomPosition,
        range?: number
    ): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET | ERR_NOT_FOUND;
}
