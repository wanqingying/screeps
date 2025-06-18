export enum Role {
  starter = "starter",
  worker = "worker",
  carrier = "carrier",
  carry = "carry", // carrier v2
  ruin_cary = "ruin_carry",
  upgrader = "upgrader",
  builder = "builder",
  harvester = "harvester",
  repairer = "repairer"
}

//@deprecated use Role instead
export enum stat_carry {
  idle = "idle",
  restore = "restore", // try to restore , no target, creep is empty
  restoreing = "restoring", // restoring, move to target and restore
  drop = "drop", // try to drop resource , no target, creep is not empty
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
