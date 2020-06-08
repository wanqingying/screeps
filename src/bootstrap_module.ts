// order matter
if (!global.module_loaded) {
    require('./bootstrap_module');
    require('./prototype_room');
    global.module_loaded = true;
}
