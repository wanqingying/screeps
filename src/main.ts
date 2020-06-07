import { role_runner } from './role';

import { check_state, check_structure } from './bootstrap';
import { log } from './utils.uta';
import {get} from 'lodash';


import { config } from './config';


module.exports.loop = function main() {
    let n=get(Game,'shard.name')
    log('==============================================tick=====================================',role_name.builder);
    check_state();
    check_structure();
    let count = config.creep_spawn_role.find(r => r.role === 'carry').count;
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];

        if (
            Object.values(Game.creeps).filter(c => c.memory.role === 'carry').length < count &&
            ['builder', 'upgrader', 'container_carry'].includes(creep.memory.role)
        ) {
            role_runner.carry(Game.creeps[name]);
            continue;
        }
        if (Object.keys(role_runner).includes(creep.memory.role)) {
            role_runner[creep.memory.role](creep);
        }
    }
};
