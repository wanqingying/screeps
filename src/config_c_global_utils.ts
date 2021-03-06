import { SpawnAuto } from './mod_spawn_creep';

global.w_utils = {
    count_distance(a, b) {
        if (!a || !b) {
            return 999;
        }
        let ax, ay, aRoomName;
        let bx, by, bRoomName;
        if (Array.isArray(a)) {
            [ax, ay, aRoomName] = a;
        } else {
            a = a?.pos || a;
            ax = a.x;
            ay = a.y;
            aRoomName = a.roomName;
        }
        if (Array.isArray(b)) {
            [bx, by, bRoomName] = b;
        } else {
            b = b?.pos || b;
            bx = b.x;
            by = b.y;
            bRoomName = b.roomName;
        }

        if (aRoomName !== bRoomName) {
            return 999;
        }
        let dx = ax - bx;
        dx = dx >= 0 ? dx : 0 - dx;
        let dy = ay - by;
        dy = dy >= 0 ? dy : 0 - dy;
        return  Math.max(dx, dy);
    },
    get_code_msg(code) {
        let ScreepsReturnCodeMsg = [
            'OK',
            'ERR_NOT_OWNER',
            'ERR_NO_PATH',
            'ERR_BUSY',
            'ERR_NAME_EXISTS',
            'ERR_NOT_FOUND',
            'ERR_NOT_ENOUGH_RESOURCES',
            'ERR_NOT_ENOUGH_ENERGY',
            'ERR_INVALID_TARGET',
            'ERR_FULL',
            'ERR_NOT_IN_RANGE',
            'ERR_INVALID_ARGS',
            'ERR_TIRED',
            'ERR_NO_BODYPART',
            'ERR_NOT_ENOUGH_EXTENSIONS',
            'ERR_RCL_NOT_ENOUGH',
            'ERR_GCL_NOT_ENOUGH',
        ];
        return ScreepsReturnCodeMsg[0 - code];
    },
    update_cache(key, newCache) {
        let che = global.w_cache.get(key);
        global.w_cache.set(key, Object.assign(che || {}, newCache));
        return global.w_cache.get(key);
    },
    print() {},
    spawn(role, name) {
        let room = Game.rooms[name];
        if (room) {
            SpawnAuto.spawnCreep(room, role);
            return true;
        }
        return false;
    },
};

global._sp = function (role, name) {
    let room = Game.rooms[name];
    if (room) {
        SpawnAuto.spawnCreep(room, role);
        return true;
    }
    return false;
};
