import { config } from './config';

export function check_screeps() {
    //刷新掉memory里不存在的creep
    for (let name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }
}

export interface spawn_creep_opt {
    role: RoleName;
    body: BodyPartConstant[];
    name?: string;
    spawn?: StructureSpawn;
}

export function spawn_role(role_name: RoleName) {
    let bd = config.creep_spawn_role.find(r => r.role === role_name).body;
    let body = [];
    if (Array.isArray(bd)) {
        body = bd;
    } else {
        Object.keys(bd).forEach(part => {
            let c = bd[part];
            body = body.concat(new Array(c).fill(part));
        });
    }
    spawn_creep({
        body: body,
        role: role_name,
        name: role_name,
    });
}

export function spawn_creep(opt: spawn_creep_opt) {
    const ind = Object.keys(Game.creeps).length;
    let k = 0;
    let indexList = Object.values(Memory.creeps).map(c => c.index);
    for (let i = 0; i <= ind; i++) {
        if (!indexList.includes(i)) {
            k = i;
            break;
        }
    }
    const spawn = opt.spawn || Game.spawns[config.rooms[config.room_name_1].spawn_name];
    const creep_name = opt.name + '_' + k || `creep${k}`;
    if (spawn.room.energyAvailable < 200 || !config.creep_spawn_on) {
        return;
    }
    let res = spawn.spawnCreep(opt.body, creep_name, {
        memory: { role: opt.role, index: k },
    });
    log('spawn_creep:', global.get_code_msg_screeps(res), opt.role);
}

export function getDistance(a: RoomPosition, b: RoomPosition): number {
    // console.log('a',a.x,'b',JSON.stringify(b));
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    return dx * dx + dy * dy;
}

export function log(...param) {
    if (config.log_on) {
        console.log(...param);
    }
}
