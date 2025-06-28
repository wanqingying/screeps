import { dc, Role } from "types";
import { restoreNearbyEnergy } from "./share";
import { dc_config, Helper } from "utils";

const { state_builder } = dc;

export function work_builder(creep: Creep) {
  const room = creep.room;
  if (creep.memory.state === state_builder.idle) {
    creep.memory.state = state_builder.restore;
  }

  if (creep.memory.state === state_builder.restore) {
    if (restoreNearbyEnergy(creep)) {
      creep.memory.state = state_builder.building;
      creep.memory.target = "";
    }
  } else if (creep.memory.state === state_builder.building) {
    handle_builder(creep);
  }
}

export function handle_builder(creep: Creep) {
  const room = creep.room;
  const config = room.memory.config || ({} as dc.Config);

  let target: ConstructionSite | AnyStructure | null = Game.getObjectById(
    creep.memory.target as Id<ConstructionSite>,
  ) as any;
  if (!target) {
    creep.memory.target = "";
    target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
  }
  if (!target && config.build_wall) {
    const fixList = room.find(FIND_STRUCTURES, {
      filter: (s: Structure) =>
        (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && s.hits < s.hitsMax,
    });
    // get a random target from the lowest hists 3;
    if (fixList.length) {
      const lowest3 = fixList.sort((a, b) => a.hits - b.hits).slice(0, 1);
      target = Helper.random_arr_value(lowest3);
    }
  }
  if (target) {
    creep.memory.target = target.id;
    creep.memory.wkn = dc.wkn_temp_role.temp_builder;
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
  } else if (target instanceof StructureWall || target instanceof StructureRampart) {
    creep.memory.target = target.id;
    if (creep.repair(target) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
    }
    creep.moveTo(target);
  } else {
    const config = room.memory.config;
    const [x, y] = config.pos_idle?.pos || [12, 25];
    creep.moveTo(x, y, { visualizePathStyle: { stroke: "#ffffff" } });
  }

  if (creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.state = state_builder.restore;
    creep.memory.target = "";
    creep.memory.wkn = dc.wkn_temp_role.temp_none;
  }
}
