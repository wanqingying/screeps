import {harvester} from "./role.harvester";
import {builder} from "./role.builder";
import {upgrader} from "./role.upgrader";
import {check_state} from "./bootstrap.check";

let a:w_role_emory={} as any;
export default function main() {
    check_state()
    throw new Error('55533355')
    Memory.errors=[]
    console.log(555);
    const tower: StructureTower = Game.getObjectById('7e36bc2b12659e2ecb74b067');
    if (tower) {
        const closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });
        if (closestDamagedStructure) {
            tower.repair(closestDamagedStructure);
        }

        const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            tower.attack(closestHostile);
        }
    }
    for (const name in Game.creeps) {

        const creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') {
            harvester.run(creep);
        }
        if (creep.memory.role == 'upgrader') {
            upgrader.run(creep);
        }
        if (creep.memory.role == "builder") {
            builder.run(creep);
        }
    }
}



