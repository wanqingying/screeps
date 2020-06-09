import { find_source_min_harvester } from './lib_room';
import { transfer_nearby } from './lib_creep';

const starter = {} as Role;

starter.setUp = function (creep) {
    let freeCap = creep.store.getFreeCapacity();
    let process = creep.memory.process;
    freeCap === 0 && (creep.memory.process = 'drop');
    if (freeCap > 0 && process !== 'drop') {
        // 有空间且不在卸货状态
        // 优先选取人数最少的矿
        let target = find_source_min_harvester(creep.room);
        if (!target) {
            creep.say('no')
            return creep.log('source not found');
        }
        target.harvesters.push(creep);
        let act = creep.harvest(target.source);
        if (act === ERR_NOT_IN_RANGE) {
            creep.moveTo(target.source);
            return false;
        }
        if (act === OK) {
            return true;
        }
        creep.say('dig')
        creep.log(`harvest mine ${target?.source?.id} ${get_code_msg_screeps(act)}`);
    }
    if (process === 'drop') {
        creep.say('drop')
        // 卸货状态，直到写完
        const act = transfer_nearby(creep);
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            creep.memory.process = 'dig';
        }
        console.log('has',creep.store.getUsedCapacity());
        return act;
    }
};

w_roles.starter = starter as any;
