import { Role } from "./enum";
import { EventBus } from "utils";

export namespace dc {
  export enum pos_type {
    ruin = 1,
    dropped = 2,
    container_controller = 3,
    container = 4,
    container_source = 5,
    storage = 6
  }
}
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
    structure: Record<string, StructureMem>;
  }
  interface StructureMem {
    target?: string; // id of the target creep
    state?: string; // state of the structure, like "idle", "working", "waiting"
  }
  interface Structure {
    memory: StructureMem;
  }

  interface Room {
    cache: {
      sources: Record<string, srouce_tsk>;
    };
  }

  interface CreepMemory {
    role: Role;
    name: string;
    room: string;
    working: boolean;
    state: string;
    target?: string;
    near?: number; // distance to target , upgrader
    _move?: any;
    harvest_ct?: number;
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
    roles: Record<string, string[]>;
  }

  interface rooms {
    [roomName: string]: {
      //   ruins_worker?: Record<string, string>;
      sources: Record<string, srouce_tsk>;
      event: EventBus;
    };
  }

  interface srouce_tsk {
    pos: RoomPosition;
    amount: number;
    pt: dc.pos_type;
    type: ResourceConstant;
    get_resource: (creep: Creep) => ScreepsReturnCode;
  }
  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
      event: EventBus;
      cache: {
        rooms: rooms;
        time: number;
      };
    }
  }
}
