import { harvestSource, isCreepStop, moveToTarget } from './lib_creep';

export function load_harvest() {
    Object.values(Game.creeps).forEach(creep => {
        if (isCreepStop(creep)) {
            return;
        }
        if (creep.memory?.role === w_role_name.harvester) {
            const { remote } = creep.memory;
            // if (remote && remote !== creep.room.name) {
            //     console.log('go remote', creep.name, remote, creep.room.name);
            //     creep.say('remote' + remote);
            //     const pos = new RoomPosition(4, 4, remote);
            //     let code = creep.moveTo(pos);
            //     console.log(w_utils.get_code_msg(code));
            //     return;
            // }

            // console.log(creep.name, remote);
            try {
                harvestSource(creep);
            } catch (e) {
                console.log('err load_harvest ', creep.name);
                console.log(e.message);
                console.log(e.stack);
            }
        }
    });
}
