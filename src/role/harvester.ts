import { Role } from "types";

export enum state_harvester {
  idle = "idle",
  harvesting = "harvesting",

  dropping = "dropping"
}

export function work_harvester(creep: Creep) {
  const room = creep.room;
  if (!creep.memory.state) {
    creep.memory.state = state_harvester.harvesting; // default state
  }
  if (creep.memory.state === state_harvester.idle) {
    creep.memory.state = state_harvester.harvesting;
  }
  if (creep.memory.state === state_harvester.harvesting) {
    let source_best: Source | null = Game.getObjectById(creep.memory.target as Id<Source>);
    if (!source_best) {
      source_best = creep.pos.findClosestByPath(FIND_SOURCES, {
        filter: s => {
          return room.memory.sources[s.id]?.container && !room.memory.sources[s.id].harvester;
        }
      });
    }
    if (!source_best) {
      source_best = creep.pos.findClosestByPath(FIND_SOURCES);
    }
    if (source_best) {
      creep.memory.target = source_best.id;
      room.memory.sources[source_best.id].harvester = creep.id;
      const container = room.memory.sources[source_best.id]?.container;
      const ct = Game.getObjectById(container as Id<StructureContainer>);
      if (creep.harvest(source_best) === ERR_NOT_IN_RANGE) {
        creep.moveTo(ct || source_best);
      }
      if (ct) {
        creep.moveTo(ct);
      }
    }
    // move to event.on('die')
    if (creep.ticksToLive && creep.ticksToLive === 1) {
      delete room.memory.sources[creep.memory.target!].harvester;
      delete creep.memory.target;
      global.event.emit("creep_die", {
        role: creep.memory.role,
        name: creep.name,
        id: creep.id,
        room: creep.room.name
      });
    }
  } else if (creep.memory.state === state_harvester.dropping) {
    const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
    if (spawn) {
      const res = creep.transfer(spawn, RESOURCE_ENERGY);
      console.log(`transferring energy to spawn: ${res}`);
      if (res === ERR_NOT_IN_RANGE) {
        creep.moveTo(spawn);
      }
    } else {
      console.log(`No spawn found for creep ${creep.name}`);
    }
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.state = state_harvester.harvesting;
    }
  }
}
