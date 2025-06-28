import { Role } from "types";
import { work_starter } from "./starter";
import { work_upgrader } from "./upgrader";
import { work_builder } from "./builder";
import { work_harvester } from "./harvester";
import { work_carrier } from "./carrier";
import { work_repair } from "./repair";
import { TransBaseTask } from "task";
import { renew } from "spawn";
import { RoleHarvestSource, get_role } from "role-v2";
import { TransTaskMST } from "task-v2/trans/trans-manager";
import { Carry } from "./carry";

const runs: Record<Role, Function> = {
  [Role.starter]: work_starter,
  [Role.worker]: () => {
    console.log("Worker role not implemented yet");
  },
  [Role.carrier]: work_carrier,
  [Role.ruin_cary]: work_carrier,
  [Role.upgrader]: work_upgrader,
  [Role.builder]: work_builder,
  // [Role.harvester]: work_harvester,
  [Role.harvester]: (creep: Creep) => {
    // get_role(creep).update_tick(creep);
    work_harvester(creep);
  },
  [Role.repairer]: work_repair,
  // [Role.carry]: TransBaseTask.run_creep,
  [Role.carry]: Carry.run_creep,
};

export function work(creep: Creep) {
  const rn_tk = 70 + Math.random() * 70;
  if (creep.ticksToLive && creep.ticksToLive < rn_tk && !creep.room.cache.renew) {
    if (![Role.builder].includes(creep.memory.role)) {
      return renew(creep);
    }
  }
  if (creep.memory.state === "renew") {
    return renew(creep);
  }
  const run = runs[creep.memory.role];
  if (run) {
    run(creep);
  } else {
    console.log(`No work function defined for role ${creep.memory.role}`);
  }
}
