Creep.prototype.log = function (...msg) {
    let px = `creep ${this.name} : `;
    log(px, msg);
};
Creep.prototype.log_one = function (...msg) {
    if (this.name === w_debug_creep) {
        let px = `creep ${this.name} : `;
        log(px, msg.reverse(), true);
    }
};
Creep.prototype.say_one = function (name, ...msg) {
    if (this.name === name) {
        this.say(...msg.reverse());
    }
};

Room.prototype.log = function (...msg) {
    let px = `room ${this.name} : `;
    log(px, msg);
};

function log(px, msg, force = false) {
    let x = msg.pop();
    while (x) {
        px += x;
        x = msg.pop();
    }
    if (force) {
    }
    if (w_config.enable_log) {
        console.log(px);
    }
}

global.w_log = function (k) {
    require('./z_module_findPath').print();
    // switch (k) {
    //     case 1:
    //         return log_W2N8();
    // }
};
global.w_a_log = function () {};

function log_W2N8() {
    const room = Game.rooms['W2N8'];
}
