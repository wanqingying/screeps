import { restoreNearbyEnergy } from "./share";

enum state_builder {
  idle = "idle",
  building = "building",
  restore = "restore"
}

export function work_builder(creep: Creep) {
  const room = creep.room;
  if (creep.memory.state === state_builder.idle) {
    creep.memory.state = state_builder.restore;
  }

  if (creep.memory.state === state_builder.restore) {
    // const is_full = getNearbyEnergy(creep);
    if (restoreNearbyEnergy(creep)) {
      creep.memory.state = state_builder.building;
      creep.memory.target = "";
    }
  } else if (creep.memory.state === state_builder.building) {
    let ext = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
      filter: s => s.structureType === STRUCTURE_EXTENSION
    });
    const target =  creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (target) {
      if (creep.build(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      if (!creep.pos.inRangeTo(target.pos, 1)) {
        creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
      }
    } else {
      //   const ruin = creep.pos.findClosestByPath(FIND_RUINS, {
      //     filter: r => r.store[RESOURCE_ENERGY] === 0 && !global.cache.rooms[room.name].ruins_worker?.[r.id]
      //   });
      //   if (ruin) {
      //     // destroy the ruin
      //     // if (creep.dismantle(ruin) === ERR_NOT_IN_RANGE) {
      //     //   creep.moveTo(ruin, { visualizePathStyle: { stroke: "#ffffff" } });
      //     // }
      //   }
    }

    if (creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.state = state_builder.restore;
      creep.memory.target = "";
    }
  }
}
