import { setIntervalTick } from "utils";
import { restoreNearbyEnergy } from "./share";
import { Role, dc } from "types";
import { handle_builder } from "./builder";

enum state_repair {
  idle = "idle",
  //   building = "building",
  restore = "restore",
  repair = "repair"
}

export function work_repair(creep: Creep) {
  if (creep.memory.state === state_repair.idle) {
    creep.memory.state = state_repair.restore;
  }

  if (creep.memory.state === state_repair.restore) {
    // const is_full = getNearbyEnergy(creep);
    if (restoreNearbyEnergy(creep)) {
      creep.memory.state = state_repair.repair;
    }
  } else if (creep.memory.state === state_repair.repair) {
    let target = Game.getObjectById(creep.memory.target as Id<Structure>);
    if (!target) {
      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: (s: Structure) => {
          if (s.structureType === STRUCTURE_ROAD) {
            return s.hitsMax - s.hits > 400;
          }
          return (
            s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART && s.hitsMax - s.hits > 200
          );
        }
      });
    }

    if (target && creep.memory.wkn !== dc.wkn_temp_role.temp_builder) {
      creep.memory.target = target.id;
      if (creep.repair(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
      }
      if (target.hits >= target.hitsMax) {
        creep.memory.target = "";
      }
    } else {
      handle_builder(creep);
    }
    if (creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.state = state_repair.restore;
      creep.memory.target = "";
    }
  }
}

// setIntervalTick(17, () => {
//   for (const name in Game.creeps) {
//     const creep = Game.creeps[name];
//     const room = creep.room;
//     if (creep.memory.wkn === dc.wkn_temp_role.temp_builder) {
//       const to_repairs = room.find(FIND_MY_STRUCTURES, {
//         filter: (s: Structure) =>
//           s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART && s.hitsMax - s.hits > 200
//       });
//       const to_fix_roads = room.find(FIND_STRUCTURES, {
//         filter: (s: Structure) => s.structureType === STRUCTURE_ROAD && s.hitsMax - s.hits > 400
//       });
//       if (to_repairs.length || to_fix_roads.length) {
//         creep.memory.wkn = dc.wkn_temp_role.temp_repairer;
//       }
//     }
//   }
// });
