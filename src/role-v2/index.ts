import { RoleHarvestSource } from "./harvest";
import { BaseRole } from "./base";
import { Role } from "types";

export function get_role(creep: Creep): BaseRole {
  if (creep.cache.role) {
    return creep.cache.role;
  } else {
    if (Role.harvester === creep.memory.role) {
      creep.cache.role = new RoleHarvestSource(creep);
    }
  }

  return creep.cache.role;
}

export { RoleHarvestSource, BaseRole };
