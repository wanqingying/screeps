import { restoreNearbyEnergy } from "./share";
import { dc_config } from "utils";

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
  const dc = dc_config.rooms[room.name];

  if (creep.memory.state === state_builder.restore) {
    if (restoreNearbyEnergy(creep)) {
      creep.memory.state = state_builder.building;
      creep.memory.target = "";
    }
  } else if (creep.memory.state === state_builder.building) {
    let target: ConstructionSite | AnyStructure | null = Game.getObjectById(
      creep.memory.target as Id<ConstructionSite>
    ) as any;
    if (!target) {
      target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    }
    if (!target && dc.build_wall) {
      const fixList = room.find(FIND_STRUCTURES, {
        filter: (s: Structure) =>
          (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && s.hits < s.hitsMax
      });
      // get a random target from the lowest hists 3;
      if (fixList.length) {
        const lowest3 = fixList.sort((a, b) => a.hits - b.hits).slice(0, 3);
        target = lowest3[Math.floor(Math.random() * lowest3.length)];
      }
    }
    if (target && target instanceof ConstructionSite) {
      creep.memory.target = target.id;
      if (creep.build(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      if (!creep.pos.inRangeTo(target.pos, 1)) {
        creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
      }
    } else if (target instanceof Structure) {
      creep.memory.target = target.id;
      if (creep.repair(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
    } else {
      const [x, y] = dc_config.rooms[room.name].pos_idle!.pos || [];
      creep.moveTo(x, y, { visualizePathStyle: { stroke: "#ffffff" } });
    }

    if (creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.state = state_builder.restore;
      creep.memory.target = "";
      global.event.emit("build_over", {
        room: room.name,
        creep_id: creep.id,
        creep_name: creep.name
      });
    }
  }
}
