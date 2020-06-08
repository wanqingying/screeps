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
            return creep.log('source not found');
        }
        target.harvesters.push(creep);
        let act = creep.harvest(target.source);
        if (act === ERR_NOT_IN_RANGE) {
            this.moveTo(target.source);
            return false;
        }
        if (act === OK) {
            return true;
        }
        this.log(`harvest mine ${target?.source?.id} ${get_code_msg_screeps(act)}`);
    }
    if (process === 'drop') {
        // 卸货状态，直到写完
        const act = transfer_nearby(creep);
        if (act === OK && creep.store.getUsedCapacity() === 0) {
            this.memory.process = 'dig';
        }
        return act;
    }
};

roles.starter = starter as any;
