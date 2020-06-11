import './roles_builder';
import './roles_carrier';
import './roles_harvester';
import './roles_starter';
import './roles_upgrader';

function work(creep: Creep) {
    let target;
    let key = 'key';
    let cacheKey = creep.memory[key];

    if (cacheKey) {
        target = Game.getObjectById(cacheKey);
    } else {
        creep.memory[key] = target?.id;
    }
}
