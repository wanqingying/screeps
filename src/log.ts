Creep.prototype.log = function (...msg) {
    let pfx = `${this.name} : ${msg}`;
    console.log(pfx);
};
