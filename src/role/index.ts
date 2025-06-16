import { Role } from "types";
import { work_starter } from "./starter";
import { work_upgrader } from "./upgrader";
import { work_builder } from "./builder";
import { work_harvester } from "./harvester";
import { work_carrier } from "./carrier";
import { work_repair } from "./repair";
import { TransBaseTask } from "task";
import { renew } from "spawn";

const runs: Record<Role, Function> = {
  [Role.starter]: work_starter,
  [Role.worker]: () => {
    console.log("Worker role not implemented yet");
  },
  [Role.carrier]: work_carrier,
  [Role.ruin_cary]: work_carrier,
  [Role.upgrader]: work_upgrader,
  [Role.builder]: work_builder,
  [Role.harvester]: work_harvester,
  [Role.repairer]: work_repair,
  [Role.carry]: TransBaseTask.run_creep
};

export function work(creep: Creep) {
  const rn_tk = 100 + Math.random() * 100;
  if (creep.ticksToLive && creep.ticksToLive < rn_tk && !creep.room.cache.renew) {
    return renew(creep);
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
