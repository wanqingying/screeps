import './bootstrap';
import {flash} from "./flash";

function main() {
    flash();
    console.log('tick');
    Object.values(Game.creeps).forEach(creep => {
        let m = creep.memory?.role;
        if (!Object.values(w_role_name).includes(m)) {
            creep.suicide();
        }
    });
    Object.values(Game.rooms).forEach(room => {
        room.start();
    });
    Object.values(Game.creeps).forEach(creep => {
        creep.run();
    });
}

module.exports.loop = main;
