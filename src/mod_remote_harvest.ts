import {harvestSource, isCreepStop, moveToTarget} from './lib_creep';
import {role_name} from "./config_a_role_name";
import {spawnCreep} from "./mod_spawn_creep";

interface CacheRoom {
    remote_harvests:Creep[]
    source:CacheSource[];
}
const cache=new Map<string,CacheRoom>()

export function load_harvest() {

    prepareCache();
    Object.values(Game.rooms).forEach(room=>{
        if (room.controller?.my){
            return
        }
        let cfg_reserve=w_config.rooms[room.name]?.reserve;
        if (!Array.isArray(cfg_reserve)||cfg_reserve.length===0){
            return
        }
        cfg_reserve.forEach(cfg=>{
            const remote_room=Game.rooms[cfg.name];
            if (!remote_room){
                return spawnCreep(room,w_role_name.remote_harvester)
            }
        })
    })


    Object.values(Game.creeps).forEach(creep => {
        if (isCreepStop(creep)) {
            return;
        }
        if (creep.memory?.role === w_role_name.harvester) {
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


function prepareCache() {
    Object.values(Game.creeps).forEach(creep=>{
        if (creep.memory.role!==w_role_name.remote_harvester){
            return
        }

    })
}

function run_remote_harvest(room:Room,config:CfgReserve) {

}




