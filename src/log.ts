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
    if (config.enable_log) {
        console.log(px);
    }
}
