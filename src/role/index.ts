import { Role } from "types";
import { work_starter } from "./starter";
import { work_upgrader } from "./upgrader";
import { work_builder } from "./builder";
import { work_harvester } from "./harvester";
import { work_carrier } from "./carrier";
import { work_repair } from "./repair";

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
  [Role.repairer]: work_repair
};

export const roles_body: Record<Role, BodyPartConstant[]> = {
  [Role.starter]: [WORK, CARRY, MOVE],
  [Role.worker]: [WORK, CARRY, MOVE],
  [Role.carrier]: [CARRY, CARRY, CARRY, MOVE, MOVE],
  [Role.ruin_cary]: [CARRY, CARRY, CARRY, MOVE, MOVE],
  [Role.upgrader]: [WORK, CARRY, MOVE],
  [Role.builder]: [WORK, CARRY, MOVE],
  [Role.harvester]: [WORK, WORK, MOVE],
  [Role.repairer]: [WORK, CARRY, MOVE]
};
export const roles_priority = [
  Role.starter,
  Role.ruin_cary,
  Role.harvester,
  Role.carrier,
  Role.upgrader,
  Role.builder,
  Role.repairer
].reverse();

export function work(creep: Creep) {
  const run = runs[creep.memory.role];
  if (run) {
    run(creep);
  } else {
    console.log(`No work function defined for role ${creep.memory.role}`);
  }
}
