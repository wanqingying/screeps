import { canReservation } from './lib_room';

const game_tick_task = new Array(5000).fill(false);

declare interface RoomTask {}
declare type _RoomCache = { spawn_tasks: [] };
const room_cache = new Map<string, _RoomCache>();

// 生产单位
export function spawnCreep(room: Room) {}

// 发布生产单位的任务
export function addSpawnTask(room: Room) {}

export function executeMyRoom(room: Room) {

}
export function executeReserveRoom(room: Room) {
    if (!canReservation(room)) {
        log(`reservation not possible `, room.name);
        return;
    }
}
export function executeOuterRoom(room: Room) {
    // nothing
}

export function execute() {
    Object.values(Game.rooms).forEach(room => {
        if (room.controller?.my) {
            executeMyRoom(room);
            return;
        }
        if (w_config.reserve_rooms.includes(room.name)) {
            executeReserveRoom(room);
        }
        executeOuterRoom(room);
    });
}

// 执行初始化逻辑 加载配置
function bootstrap() {
    const begin = {};
    Object.values(Game.rooms).forEach(room => {
        room_cache.set(room.name, { spawn_tasks: [] });
    });
}

bootstrap();
