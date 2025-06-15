import { Role } from "types";
import { getDropTarget, transfer, TransOver } from "./share";

export enum state_carrier {
  idle = "idle",
  restore = "restore",

  dropping = "dropping"
}

export function work_carrier(creep: Creep) {
  const room = creep.room;
  if (!creep.memory.state) {
    creep.memory.state = state_carrier.restore; // default state
  }
  if (creep.memory.state === state_carrier.idle) {
    creep.memory.state = state_carrier.restore;
  }
  if (creep.memory.state === state_carrier.restore) {
    const target = getRestoreTarget(creep);
    if (target) {
      if (target instanceof Resource) {
        if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, {
            visualizePathStyle: {
              fill: "transparent",
              stroke: "#fff",
              lineStyle: "dashed",
              strokeWidth: 0.15,
              opacity: 0.1
            }
          });
        }
        if (target.amount === 0) {
          creep.memory.target = "";
        }
      }
      if (target instanceof StructureContainer || target instanceof Ruin) {
        if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, {
            visualizePathStyle: {
              fill: "transparent",
              stroke: "#fff",
              lineStyle: "dashed",
              strokeWidth: 0.15,
              opacity: 0.1
            }
          });
        }
        if (target.store[RESOURCE_ENERGY] === 0) {
          creep.memory.target = "";
        }
      }
    } else {
      //   console.log(`No restore target found for creep ${creep.name}`);
      if (creep.store[RESOURCE_ENERGY] > 0) {
        creep.memory.state = state_carrier.dropping;
      }
    }
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.state = state_carrier.dropping;
      delete creep.memory.target;
      delete creep.memory._move;
    }
  } else if (creep.memory.state === state_carrier.dropping) {
    const res = transfer(creep);
    if (res === TransOver.empty) {
      creep.memory.state = state_carrier.restore;
      delete creep.memory.target;
      delete creep.memory._move;
    }
  }
}

type ResTargetType = StructureStorage | StructureContainer | Resource | Ruin;

function getRestoreTarget(creep: Creep): ResTargetType | null {
  const room = creep.room;
  const tid = creep.memory.target as Id<ResTargetType>;
  const target = Game.getObjectById(tid);
  if (target) {
    return target;
  } else {
    creep.memory.target = "";
  }
  const ruin_x = creep.pos.findClosestByPath(FIND_RUINS, {
    filter: r => r.store[RESOURCE_ENERGY] > 0
  });

  if (ruin_x) {
    creep.memory.target = ruin_x.id;
    return ruin_x;
  }

  const dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
    filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 20
  });
  if (dropped) {
    creep.memory.target = dropped.id;
    return dropped;
  }
  const containers = Object.values(room.memory.sources)
    .map(s => s.container)
    .map(id => Game.getObjectById(id as Id<StructureContainer>))
    .filter(c => c && c.store[RESOURCE_ENERGY] > 100) as StructureContainer[];
  containers.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]);
  if (containers.length > 0) {
    creep.memory.target = containers[0].id;
    return containers[0];
  } else {
    console.log(`No container found for creep ${creep.name}`);
  }

  return null;
}
