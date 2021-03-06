/**
 * 全局统计信息扫描器
 * 负责搜集关于 cpu、memory、GCL、GPL 的相关信息
 */
export function stat_scan() {
    // 每 20 tick 运行一次
    if (Game.time % 15) return;

    if (!Memory.stats) {
        Memory.stats = { rooms: {} } as any;
    }
    if (!Memory.stats_help) {
        Memory.stats_help = { prev_gcl: Game.gcl.progress };
    }

    // 统计 GCL / GPL 的升级百分比和等级
    const rate_gcl = Game.gcl.progress / Game.gcl.progressTotal;
    Memory.stats.tick = Game.time;
    Memory.stats.gcl_rate = Math.round(rate_gcl * 100) / 100;
    Memory.stats.gcl = Game.gcl.progress;
    Memory.stats.gcl_increase = Game.gcl.progress - Memory.stats_help.prev_gcl;
    Memory.stats.gclLevel = Game.gcl.level;
    const rate_gpl = Game.gpl.progress / Game.gpl.progressTotal;
    Memory.stats.gpl_rate = Math.round(rate_gpl * 100) / 100;
    Memory.stats.gpl = Game.gpl.progress;

    Memory.stats_help.prev_gcl = Game.gcl.progress;
    // CPU 的当前使用量
    Memory.stats.cpu = Math.round(Game.cpu.getUsed() * 100) / 100;
    // bucket 当前剩余量
    Memory.stats.bucket = Math.round(Game.cpu.bucket * 100) / 100;

    if (!Memory.stats.rooms) {
        Memory.stats.rooms = {} as any;
    }

    Object.values(Game.rooms).forEach(room => {
        if (!room.controller?.my) {
            return;
        }
        let stat: StatsRoom = {} as any;

        stat.controller_points = room.controller.progress;
        if (room.storage) {
            stat.storageEnergy = room.storage.store.energy;
        }
        Memory.stats.rooms[room.name] = stat;
    });
}
