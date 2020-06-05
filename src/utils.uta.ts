import { config } from './boostrap.config';
import { roomList } from './bootstrap.constant';

export function check_screeps() {
    // reset creep name
   if (config.creep_check_name){
       Object.values(Game.creeps).forEach((creep, i) => {
           if (!creep.name.startsWith('creep')) {
               creep.suicide();
               const index=creep.memory.index
               if (typeof index==="number"&&Memory.creeps_spawn_index.includes(index)){
                   Memory.creeps_spawn_index.push(index);
               }
           }
       });
   }



    //刷新掉memory里不存在的creep
    for (let name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }
}

export interface spawn_creep_opt {
    role: role_name;
    body: BodyPartConstant[];
    name?: string;
    spawn?: StructureSpawn;
}

export function spawn_creep(opt: spawn_creep_opt) {
    const ind = Object.keys(Game.creeps).length;
    const spawn = opt.spawn || Game.spawns[config.rooms.W2N8.spawn_name];
    const creep_name = opt.name || `creep${ind}`;
    spawn.spawnCreep(opt.body, creep_name, {
        memory: { role: opt.role, index: ind },
    });
}

export function log(...param) {
    if (config.log_on) {
        console.log(...param);
    }
}
