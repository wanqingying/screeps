export enum Role {
  starter = "starter",
  worker = "worker",
  carrier = "carrier",
  ruin_cary = "ruin_carry",
  upgrader = "upgrader",
  builder = "builder",
  harvester = "harvester",
  repairer = "repairer"
}

enum stat_carry {
  idle = "idle",
  restore = "restore", // try to restore , no target
  restoreing = "restoring", // restoring, move to target
  drop = "drop", // try to drop resource
  dropping = "dropping" // move to target and drop
}

export enum state_starter {
  idle = "idle",
  harvesting = "harvesting",

  dropping = "dropping"
}

export enum state_updater {
  idle = "idle",
  upgrading = "upgrading",
  dropping = "dropping",
  restore = "restore"
}
