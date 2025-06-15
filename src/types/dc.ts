import { Role } from "./enum";

export namespace dc {
  export enum pos_type {
    ruin = 1,
    dropped = 2,
    container_controller = 3,
    container = 4,
    container_source = 5,
    storage = 6
  }
  export enum wkn_temp_role {
    temp_none = "temp_none",
    temp_builder = "temp_builder",
    temp_repairer = "temp_repairer"
  }
  export enum state_builder {
    idle = "idle",
    building = "building",
    restore = "restore"
  }
  // room config
  export interface Config {
    pos_idle?: {
      pos: [number, number];
    };
    min_source_ctn: number;
    build_wall?: boolean;
    roles_limit: Record<Role, number>;
  }

  export interface GameConfig {
    rooms: Record<string, Config>;
  }

  export interface base_task<Target extends _HasId> {
    id?: string;
    pos: RoomPosition;
    t_id: Id<Target>;
    resource_type?: ResourceConstant;
  }
  export interface srouce_task {
    pos: RoomPosition;
    amount: number;
    pt: dc.pos_type;
    type: ResourceConstant;
    get_resource: (creep: Creep) => ScreepsReturnCode;
  }
}
