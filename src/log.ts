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
Creep.prototype.say_one = function (...msg) {
    if (this.name === w_debug_creep) {
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
        g_log(px);
    }
}
global.w_log_on = false;
global.w_log_err_on = true;
global.g_log = function (...p) {
    if (global.w_log_on) {
        console.log(...p);
    }
};
global.g_log_err = function (...p) {
    if (global.w_log_err_on) {
        console.log(...p);
    }
};
global.w_log = function (...p) {
    if (global.w_log_on) {
        log('', p);
    }
};
global.w_a_log = function () {};

function log_W2N8() {
    const room = Game.rooms['W2N8'];
}
