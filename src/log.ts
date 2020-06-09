Creep.prototype.log = function (...msg) {
    let px = `creep ${this.name} : `;
    log(px, msg);
};

Room.prototype.log = function (...msg) {
    let px = `room ${this.name} : `;
    log(px, msg);
};

function log(px, msg) {
    let x = msg.pop();
    while (x) {
        px += x;
        x = msg.pop();
    }
    if (w_config.enable_log) {
        console.log(px);
    }
}

global.log = function (k) {
    switch (k) {
        case 1:
            return log_W2N8();
    }
};

function log_W2N8() {
    const room = Game.rooms['W2N8'];
    console.log(JSON.stringify(room.roleExist));
}
