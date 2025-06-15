import { getDropTarget, transfer, TransOver } from "./share";
import { Role, state_starter } from "types";

export function work_starter(creep: Creep) {
  let is_full = false;
  if (!creep.memory.state) {
    creep.memory.state = state_starter.harvesting; // default state
  }
  if (creep.memory.state === state_starter.idle) {
    creep.memory.state = state_starter.harvesting;
  }
  if (creep.memory.state === state_starter.harvesting) {
    const source = creep.pos.findClosestByPath(FIND_SOURCES);
    if (source) {
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      }
    } else {
    //   console.log(`No source found for creep ${creep.name}`);
    }
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.state = state_starter.dropping;
    }
  } else if (creep.memory.state === state_starter.dropping) {
    const res = transfer(creep);

    if (res === TransOver.empty) {
      creep.memory.state = state_starter.harvesting;
    }
  }
}

export function nextState(creep: Creep, is_full = false) {
  const current = creep.memory.state as state_starter;
  const isEmpty = creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0;
  const isFull = creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0;

  if (is_full && isFull) {
    creep.memory.state = state_starter.dropping;
    return;
  }

  if (current === state_starter.harvesting && isFull) {
    creep.memory.state = state_starter.dropping;
  } else if (current === state_starter.dropping && isEmpty) {
    creep.memory.state = state_starter.harvesting;
  } else {
    // console.log(`${creep.name} in unknown state: ${current}, reset to harvesting`);
    // creep.memory.state = state_starter.harvesting; // reset
  }
}
