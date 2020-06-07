Creep.prototype.log = function (...msg) {
    log(msg);
};

Room.prototype.log = function (...msg) {
    log.bind(this)(msg);
};

function log(msg) {
    let px = `room ${this.name} : `;
    let x = msg.pop();
    while (x) {
        px += x;
        x = msg.pop();
    }
    if (config.enable_log) {
        console.log(px);
    }
}
