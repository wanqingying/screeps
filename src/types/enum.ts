export enum Role {
  starter = "starter",
  worker = "worker",
  carrier = "carrier",
  ruin_cary = "ruin_carry",
  upgrader = "upgrader",
  builder = "builder",
  harvester = "harvester"
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
