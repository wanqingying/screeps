import { prepare_room } from './lib_room';
import { run_creep } from './lib_creep';
import { flash } from './flash';

function main() {
    flash();
    Object.values(Game.rooms).forEach(room => {
        prepare_room(room);
    });
    Object.values(Game.creeps).forEach(creep => {
        run_creep(creep);
    });
}

module.exports.loop = main;
