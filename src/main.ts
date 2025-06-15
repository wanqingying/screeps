import "./prototype/room";
import { ErrorMapper } from "utils/ErrorMapper";
import { work } from "./role";
import { spawnCreep, spawn_room, getRolesCount } from "./spawn";
import { Role } from "types";
import { init } from "room";
import { tick_callbacks } from "utils";

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  // get all creeps in the game
  const creeps = Object.values(Game.creeps);
  const room = Object.values(Game.rooms)[0];
  init(room);
  for (const fn of tick_callbacks) {
    fn(room);
  }
  const roles = room.memory.roles || {};
  // Automatically delete memory of missing creeps
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
  const roles_count = getRolesCount(room);

  // const rm = Array.from(Object.entries(roles).map(([role, creeps]) => [role, creeps.length].join(":"))).join(", ");
  const rm = Object.entries(roles_count)
    .map(([role, count]) => `${role}: ${count}`)
    .join(", ");
  if (Game.time % 10 === 0) {
    console.log(`time:${Game.time}, ${rm}`);
  }

  spawn_room(room);
  // room

  for (const creep of creeps) {
    work(creep);
  }
});
