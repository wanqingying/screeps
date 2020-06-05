import { harvester } from './role.harvester';
import { builder } from './role.builder';
import { upgrader } from './role.upgrader';
import { check_state } from './bootstrap.check';

module.exports.loop = function main() {
    console.log('tick');
    check_state();
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') {
            harvester.run(creep);
        }
        if (creep.memory.role == 'upgrader') {
            upgrader.run(creep);
        }
        if (creep.memory.role == 'builder') {
            builder.run(creep);
        }
        if (creep.memory.role == 'starter') {
            harvester.run(creep);
        }
    }
};
