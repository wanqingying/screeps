import { Role, dc } from "types";
import { EventBus, setIntervalTick, dc_config } from "utils";
export * from "./tower";

console.log("Room index loaded");
global.event = new EventBus();

global.event.on("build_over", (data: any) => {
  console.log("event build_over", JSON.stringify(data));
});
if (!global.cache) {
  global.cache = { rooms: {}, time: Game.time };
}

export function init_mem(room: Room) {
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
  function get_role_by_name(name: string) {
    for (const role of Object.values(Role)) {
      if (name.includes(role)) {
        return role;
      }
    }
    return Role.starter; // default role
  }

  // ini creeps
  const creeps = room.find(FIND_MY_CREEPS);
  for (const creep of creeps) {
    if (!creep.memory.role) {
      creep.memory = {
        role: get_role_by_name(creep.name),
        name: creep.name,
        room: room.name,
        wkn: dc.wkn_temp_role.temp_none,
        state: "idle"
      };
    }
    room.memory.roles[creep.memory.role].push(creep.name);
  }
  // Automatically delete memory of missing creeps
  const roles = room.memory.roles || {};

  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
      return;
    }

    const creep_mem = Memory.creeps[name];
    if (creep_mem.role in roles) {
      // roles[creep_mem.role].push(creep_mem);
    } else {
      console.log(`Creep ${name} has unknown role ${creep_mem.role}`);
      delete Memory.creeps[name];
      // destroy the creep
    }
  }

  //   ini sources

  // init config
  if (!room.memory.config) {
    const config = dc_config.rooms[room.name];
    if (!config) {
      throw new Error(`No config found for room ${room.name}`);
    }
    room.memory.config = config;
  }
}

setIntervalTick(13, () => {
  for (const room of Object.values(Game.rooms)) {
    if (!room.memory.sources) continue;
    for (const [id, s] of Object.entries(room.memory.sources)) {
      if (s.harvester) {
        const creep = Game.getObjectById(s.harvester as Id<Creep>);
        if (!creep) {
          delete s.harvester;
        }
      }
      if (s.container) {
        const container = Game.getObjectById(s.container as Id<StructureContainer>);
        if (!container) {
          delete s.container;
        }
      }
      const source = Game.getObjectById(id as Id<Source>);
      if (source && !s.container) {
        const containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
          filter: s => s.structureType === STRUCTURE_CONTAINER
        });
        if (containers.length) {
          room.memory.sources[id].container = containers[0].id as Id<StructureContainer>;
        }
      }
    }
  }
});

setIntervalTick(3, () => {
  for (const room of Object.values(Game.rooms)) {
    init_mem(room);
  }
});
