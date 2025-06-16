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

  export enum trans_type {
    in = "in",
    out = "out"
  }
  export interface base_task<Target extends _HasId> {
    id?: string;
    pos: RoomPosition;
    t_id: Id<Target>;
    rank: number;
    min_amount: number; // -1 eq creep capacity.  min amount to transfer
    type: trans_type;
    d_time: number; // deadline time , like Tombstone decay time
  }
  export interface trans_in_task<Target extends _HasId> extends base_task<Target> {
    resource_need: Partial<Record<ResourceConstant, number>>;
  }
  export interface trans_out_task<Target extends _HasId> extends base_task<Target> {}
}
