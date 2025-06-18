import { dc } from "types";

interface LocalCache {
  workers: Record<string, BaseRole>;
}

const local_cache: LocalCache = {
  workers: {},
};

// each creep has a base work class
export abstract class BaseRole {
  protected creep: Creep;
  public readonly role: dc.role;

  private _state: dc.stat_role = dc.stat_role.idle;
  protected setState(state: dc.stat_role) {
    this._state = state;
  }
  public get state() {
    return this._state;
  }
  public abstract idle_next: dc.stat_role;

  public get memory(): CreepMemory {
    return this.creep.memory;
  }
  public get id(): Id<Creep> {
    return this.creep.id;
  }
  public get name(): string {
    return this.creep.name;
  }

  constructor(creep: Creep, role: dc.role) {
    this.role = role;
    this.creep = creep;
    local_cache.workers[creep.id] = this;
  }
  // called every tick
  public update_tick(creep: Creep) {
    this.creep = creep;
    if (this.state === dc.stat_role.idle || !this.state) {
      this.setState(this.idle_next);
    }
  }

  public renew() {
    const spawns = this.creep.room.find(FIND_MY_SPAWNS);
  }

  public cleanup() {
    delete local_cache.workers[this.id];
    this.creep = undefined as any; // clear the creep reference
  }

  public static do_cleanup() {
    for (const [id, worker] of Object.entries(local_cache.workers)) {
      try {
        if (!Game.creeps[worker.creep.name]) {
          worker.cleanup();
        }
      } catch (e) {
        console.log(`Error cleaning up worker ${id}:`, e);
        worker.cleanup();
      }
    }
  }

  public moveTo(pos: RoomPosition) {
    return this.creep.moveTo(pos);
  }

  public findTargetToGet() {}
}
