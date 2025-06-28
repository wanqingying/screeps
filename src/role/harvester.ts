import { Role } from "types";
import { Helper } from "utils";

export enum state_harvester {
  idle = "idle",
  harvesting = "harvesting",

  dropping = "dropping",
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
    const exts = room.extend.get_sources_ext();
    let source: Source | null = Game.getObjectById(creep.memory.target as Id<Source>);
    if (!source) {
      const source_ext = exts.filter(e => {
        const creep = Game.getObjectById(e.harvester as Id<Creep>);
        return !creep || creep.memory.target !== e.id;
      });
      const clost = Helper.getClosestByPos(creep.pos, source_ext);
      source = Game.getObjectById(clost?.id as Id<Source>);
    }
    if (!source) {
      creep.say("no source");
      return;
    }
    const ext = exts.find(e => e.id === source.id);
    const pos1 = ext?.container?.pos;
    const pos2 = source.pos;

    if (pos1 && !creep.pos.isEqualTo(pos1)) {
      creep.moveTo(pos1);
    } else if (pos2 && !creep.pos.isNearTo(pos2)) {
      creep.moveTo(pos2);
    } else {
      creep.harvest(source);
    }
    if (source) {
      creep.memory.target = source.id;
      room.extend.update_source_ext(source.id, {
        harvester: creep.id,
      });
    }
    if (creep.ticksToLive && creep.ticksToLive === 1) {
      delete room.memory.sources[creep.memory.target!].harvester;
      delete creep.memory.target;
      global.event.emit("creep_die", {
        role: creep.memory.role,
        name: creep.name,
        id: creep.id,
        room: creep.room.name,
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
