import './config_c_global_utils';
global.w_roles = {} as Roles;
global.w_cache = new Map<any, any>();
global.w_my_name = Object.values(Game.rooms).find(
    room => room.controller?.my
).controller.owner.username;
global.w_debug_creep = 'harvester_7';
global.module_loaded = true;
