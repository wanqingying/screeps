global.w_utils = {
    count_distance(a, b) {
        a=(a as any)?.pos||a;
        b=(b as any)?.pos||b;
        if (!a||!b){
            return 999
        }
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        return Math.round(Math.pow(dx * dx + dy * dy, 0.5));
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
};
