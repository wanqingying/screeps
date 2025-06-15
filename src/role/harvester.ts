import { Role } from "types";

export enum state_harvester {
  idle = "idle",
  harvesting = "harvesting",

  dropping = "dropping"
}

export function work_harvester(creep: Creep) {
  let is_full = false;
  const room = creep.room;
  if (!creep.memory.state) {
    creep.memory.state = state_harvester.harvesting; // default state
  }
  if (creep.memory.state === state_harvester.idle) {
    creep.memory.state = state_harvester.harvesting;
  }
  if (creep.memory.state === state_harvester.harvesting) {
    const source = creep.pos.findClosestByPath(FIND_SOURCES);
    if (source) {
      const container = room.memory.sources[source.id]?.container;
      const ct = Game.getObjectById(container as Id<StructureContainer>);
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(ct || source);
      }
      if (ct) {
        creep.moveTo(ct);
      }
    }

    // if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
    //   creep.memory.state = state_starter.dropping;
    // }
  } else if (creep.memory.state === state_harvester.dropping) {
    const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
    if (spawn) {
      const res = creep.transfer(spawn, RESOURCE_ENERGY);
      console.log(`transferring energy to spawn: ${res}`);
      if (res === ERR_NOT_IN_RANGE) {
        creep.moveTo(spawn);
      }
      if (res === ERR_FULL) {
        is_full = true;
        // creep.memory.state = starter_state.container_full;
        // return;
      }
    } else {
      console.log(`No spawn found for creep ${creep.name}`);
    }
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.state = state_harvester.harvesting;
    }
  }
}
