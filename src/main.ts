import "./mod/path.js";
import "types";
import "./prototype/room";
import "./prototype/tower";
import "./prototype/creep";
import { ErrorMapper } from "utils/ErrorMapper";
import { work } from "./role";
import { spawnCreep, spawn_room, getRolesCount } from "./spawn";
import { Role } from "types";
import { init_mem, runTowerAtk } from "room";
import { player, tick_callbacks } from "utils";
import { init_trans_tasks } from "task";
import { TransTaskMST } from "task-v2/trans/trans-manager.js";
import { RoomExtend } from "extend/room.js";

init_trans_tasks();

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  RoomExtend.run_tick();
  // get all creeps in the game
  const creeps = Object.values(Game.creeps);
  const room = Object.values(Game.rooms)[0];
  if (global.cache.rooms[room.name]?.init !== true) {
    init_mem(room);
  }
  for (const fn of tick_callbacks) {
    fn(room);
  }
  // console.log(`time:${Game.time}, rd:${room.extend.getRdGameTime("loop")}`);
  runTowerAtk(room);
  // console.log("sources ", JSON.stringify(room.extend.get_sources_ext()));

  if (Game.time % 10 === 0) {
    const roles_count = getRolesCount(room);
    const rm = Object.entries(roles_count)
      .map(([role, count]) => `${role}: ${count}`)
      .join(", ");
    console.log(`time:${Game.time}, ${rm}`);
  }

  if (Game.time % 3 === 0) {
    spawn_room(room);
  }
  // TransTaskMST.run_tick();

  for (const creep of creeps) {
    work(creep);
  }
});
