import { Role } from "./enum";
import { EventBus } from "utils";
import { dc } from "./dc";

declare global {
  /*
	Example types, expand on these or remove them and add your own.
	Note: Values, properties defined here do no fully *exist* by this type definiton alone.
		  You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

	Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
	Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
    tower: Record<string, TowerMemory>;
  }

  interface TowerMemory {
    target?: string;
    state?: string;
    warn?: number;
  }
  interface StructureTower {
    memory: TowerMemory;
  }

  interface CreepMemory {
    role: Role;
    name: string;
    room: string;
    wkn: dc.wkn_temp_role;
    state: string;
    target?: string;
    task?: string;
    near?: number; // distance to target , upgrader
    _move?: any;
    harvest_ct?: number;
    debug?: string;
  }
  interface RoomMemory {
    sources: Record<
      string,
      {
        container?: Id<StructureContainer>; // source related containers id
        harvester?: Id<Creep>;
      }
    >;
    controller?: {
      id: string;
      container?: Id<StructureContainer>;
      link?: Id<StructureLink>;
    };
    spawns?: Record<
      string,
      {
        stat: dc.stat_spawn;
      }
    >;
    roles: Record<string, string[]>;
    config: dc.Config;
  }

  interface SpawnMemory {
    stat: dc.stat_spawn;
  }
}
