import { SpawnAuto } from './mod_spawn_creep';
import { moveToTarget } from './lib_creep';

// process 0:未开始 1:占领 2:建造spawn 3:占领完成
const cache = { process: 0, claim_creep_count: 0, ext_creeps: {} };

// 占领新房间
export function load_claim() {
    let cfg = w_config.rooms;
    const name = Object.keys(cfg).find(k => cfg[k].claims);
    if (!name) {
        return;
    }
    let cfg_claim = cfg[name].claims;
    let claim_room_name = cfg_claim.name;
    let claim_room = Game.rooms[claim_room_name];
    let from_room = Game.rooms[name];
    if (!claim_room_name) {
        return;
    }
    prepareCache();

    g_log('claim progress ', cache.process);
    if (cache.process === 3) {
        return;
    }
    if (cache.process === 0) {
        // todo 生产单位移动过去
        SpawnAuto.spawnCreep(from_room, w_role_name.claim);
        return;
    }
    if (cache.process === 1) {
        Object.values(Game.creeps).forEach(creep => {
            if (creep.spawning) {
                return;
            }
            if (creep.memory.role === w_role_name.claim) {
                if (claim_room) {
                    creep.claimController(claim_room.controller);
                    moveToTarget(creep, claim_room.controller as any);
                } else {
                    moveToTarget(creep, new RoomPosition(25, 25, claim_room_name));
                }
                return;
            }
        });
    }
    if (cache.process === 1) {
        let cfg_creep = cfg_claim.creep;
        for (let i = 0; i < cfg_creep.length; i++) {
            let [role, num] = cfg_creep[i];
            let cur_num = cache.ext_creeps[role] || 0;
            if (cur_num < num) {
                SpawnAuto.spawnCreep(from_room, role, { target_room: cfg_claim.name });
                break;
            }
        }
    }

    Object.values(Game.creeps).forEach(creep => {
        if (creep.spawning) {
            return;
        }
        const target_room_name = creep.memory.target_room;
        if (target_room_name && target_room_name !== creep.room.name) {
            const pos = new RoomPosition(25, 25, target_room_name);
            moveToTarget(creep, pos);
        }
    });
}

function prepareCache() {
    let cfg = w_config.rooms;
    const name = Object.keys(cfg).find(k => cfg[k].claims);
    let cfg_claim = cfg[name].claims;
    let claim_room_name = cfg_claim.name;
    let claim_room = Game.rooms[claim_room_name];
    cache.ext_creeps = {};
    Object.values(Game.creeps).forEach(c => {
        let target_room = c.memory.target_room;
        if (target_room) {
            if (!cache.ext_creeps[c.memory.role]) {
                cache.ext_creeps[c.memory.role] = 0;
            }
            cache.ext_creeps[c.memory.role] += 1;
        }

        if (c.memory.role === w_role_name.claim) {
            if (!cache.claim_creep_count) {
                cache.claim_creep_count = 0;
            }
            cache.claim_creep_count += 1;
        }
    });
    if (cache.claim_creep_count === 0) {
        cache.process = 0;
        // return;
    }
    if (cache.claim_creep_count > 0) {
        cache.process = 1;
        // return;
    }
    if (!claim_room) {
        return;
    }

    let spawn = claim_room.find(FIND_MY_CONSTRUCTION_SITES, {
        filter: s => s.structureType === STRUCTURE_SPAWN,
    });
    if (spawn.length > 0 && claim_room.controller.my) {
        cache.process = 2;
    }
    let cont = claim_room.find(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER,
    });
    if (claim_room.controller.level >= 3) {
        g_log('claim done');
        cache.process = 3;
        return;
    }
}
