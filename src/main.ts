import './bootstrap';
import { prepare_room } from './lib_room';
import { run_creep } from './lib_creep';
import { flash } from './flash';
import { create } from 'domain';

function main() {
    console.log('---tick---', Game.time);
    flash();
    Object.values(Game.creeps).forEach(creep => {
        let m = creep.memory?.role;
        if (!Object.values(role_name).includes(m)) {
            creep.suicide();
        }
    });
    Object.values(Game.rooms).forEach(room => {
        prepare_room(room);
    });
    Object.values(Game.creeps).forEach(creep => {
        run_creep(creep);
    });
}

module.exports.loop = main;
