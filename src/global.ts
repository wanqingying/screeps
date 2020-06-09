// 不能引入其他模块
global.w_roles = {} as Roles;

global.get_code_msg_screeps = function (code) {
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
};

global.count_distance = function (a, b) {
    if (!a || !b) {
        return 9999;
    }
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    return Math.round(Math.pow(dx * dx + dy * dy, 0.5));
};

global.ERR_TARGET_NOT_FOUND = -217;

global.w_cache = new Map<any, any>();
global.w_rooms = new Map();
global.w_creeps = new Map();
global.module_loaded = true;
