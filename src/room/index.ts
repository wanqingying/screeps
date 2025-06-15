import { Role } from "types";

console.log("Room index loaded");

export function init(room: Room) {
  if (room.controller) {
    // initController(room.controller);
    const ct = room.controller;
    if (!room.memory.controller) {
      room.memory.controller = {
        id: ct.id
      };
    }

    if (!room.memory.controller.container) {
      const containers = ct.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      });
      if (containers.length) {
        room.memory.controller.container = containers[0].id as Id<StructureContainer>;
      }
    }
  }
  if (!global.cache) {
    global.cache = { rooms: {}, time: Game.time };
  }
  if (!global.cache.rooms[room.name]) {
    global.cache.rooms[room.name] = {
      sources: {}
    };
  }

  if (!room.memory.sources) {
    room.memory.sources = {};
  }
  const sources = room.find(FIND_SOURCES);
  for (const source of sources) {
    if (!room.memory.sources[source.id]) {
      room.memory.sources[source.id] = {};
      if (!room.memory.sources[source.id].container) {
        const containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
          filter: s => s.structureType === STRUCTURE_CONTAINER
        });
        if (containers.length) {
          room.memory.sources[source.id].container = containers[0].id as Id<StructureContainer>;
        }
      }
    }
  }
  if (!room.memory.roles) {
    room.memory.roles = {};
  }
  // each Role
  for (const role of Object.values(Role)) {
    room.memory.roles[role] = [];
  }

  // ini creeps
  const creeps = room.find(FIND_MY_CREEPS);
  for (const creep of creeps) {
    if (!creep.memory.role) {
      creep.memory = {
        role: Role.starter,
        name: creep.name,
        room: room.name,
        working: false,
        state: "idle"
      };
    }
    room.memory.roles[creep.memory.role].push(creep.name);
  }

  // ini sources
//   const ruins = room.find(FIND_RUINS, {
//     filter: r => r.store[RESOURCE_ENERGY] > 0
//   });
//   for (const ruin of ruins) {

//   }
}
