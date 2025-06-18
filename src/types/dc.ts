import { Role } from "./enum";

export namespace dc {
  export enum role {
    starter = "starter",
    worker = "worker",
    carrier = "carrier",
    carry = "carry", // carrier v2
    ruin_cary = "ruin_carry",
    upgrader = "upgrader",
    builder = "builder",
    harvester = "harvester",
    repairer = "repairer",
  }
  export enum stat_role {
    idle = "idle",

    restore = "restore",

    harvest = "harvest",

    build = "build",

    repair = "repair",

    upgrade = "upgrade",

    drop = "drop",
  }
  export enum stat_spawn {
    idle = "idle",

    building = "building",

    spawning = "spawning",

    renew = "renew",
  }
  export enum stat_carry {
    idle = "idle",
    restore = "restore", // try to restore , no target, creep is empty
    restoreing = "restoring", // restoring, move to target and restore
    drop = "drop", // try to drop resource , no target, creep is not empty
    dropping = "dropping", // move to target and drop
  }

  export enum code_ret {
    ok = OK,

    err_no_target = -1,

    err_unknown = -77,

    err_not_in_range = 3,
  }

  export interface FindFilter<T> {
    filter?: (t: T) => boolean;
  }
  export enum pos_type {
    ruin = 1,
    dropped = 2,
    container_controller = 3,
    container = 4,
    container_source = 5,
    storage = 6,
  }
  export enum wkn_temp_role {
    temp_none = "temp_none",
    temp_builder = "temp_builder",
    temp_repairer = "temp_repairer",
  }
  export enum state_builder {
    idle = "idle",
    building = "building",
    restore = "restore",
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
    out = "out",
  }
  export interface base_task<Target extends _HasId> {
    id?: string;
    pos: RoomPosition;
    t_id: Id<Target>;
    rank: number;
    min_amount: number; // -1 eq creep capacity.  min amount to transfer
    type: trans_type;
    d_time: number; // deadline time , like Tombstone decay time
    desc: string;
  }
  export interface trans_in_task<Target extends _HasId> extends base_task<Target> {
    resource_need: Partial<Record<ResourceConstant, number>>;
  }
  export interface trans_out_task<Target extends _HasId> extends base_task<Target> {}
}
