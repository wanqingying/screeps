import { dc, Role, stat_carry, state_updater } from "types";

declare global {
  interface cache_room {
    tasks: Map<string, TransBaseTask<any>>;
    task_out_targets: Map<string, string>; // Record<targetId, taskId>
    task_in_targets: Map<string, string>;
    trans_out_priority: string[];
    trans_in_priority: string[];
    max_rank_in: number;
    max_rank_out: number;
  }
}

export const TickC = 20; //  creep cost about 50 ticks to transfer
export const TickF = 500000; // tick forever
export const max_idle_time = 150; // max idle time for a task

// 运出优先级  任务需要 rank_out + rank_in >= 10
export const rank_out_map = {
  container_source: 8, // harvest source
  resource: 8, // droped resource
  ruin: 8, // ruin
  tombstone: 8,
  storage: 5,
  container: 5,
  link: 3,
  container_controller: 2,
  tower: 1
};
// 需求优先级
export const rank_in_map = {
  spawn: 8,
  extension: 8,
  tower: 8,
  container_controller: 7,
  link: 6,
  storage: 4,
  container: 3,
  container_source: 1 // harvest source
};

// each room have one BaseTask
export abstract class TransBaseTask<Target extends _HasId = any> {
  public abstract getAmountLeft(): number;
  public abstract reserve(creep: Creep): void;
  public abstract do_work(creep: Creep): any;
  public abstract finish(creep: Creep): void;

  public static run_creep(creep: Creep) {
    const room = creep.room;
    const max_rank_in = room.cache.max_rank_in;
    const max_rank_out = room.cache.max_rank_out;
    const cap = creep.store.getCapacity();
    if (creep.memory.role !== Role.carry) {
      return console.error(`TransOutTask.run_creep creep ${creep.name} role is not carry`);
    }
    if (creep.spawning) return;
    if (creep.memory.state === stat_carry.idle) {
      creep.memory.state = stat_carry.restore;
    }

    if (stat_carry.restore === creep.memory.state) {
      let has_restore = false;
      for (const id of room.cache.trans_out_priority) {
        const task = room.cache.tasks.get(id) as TransBaseTask;
        const amount_left = task.getAmountLeft();
        const min_amount = task.getMinAmount(creep);
        if (amount_left < min_amount) continue;
        if (task.rank + max_rank_in < 10) continue;
        creep.memory.state = stat_carry.restoreing;
        task.reserve(creep);
        has_restore = true;
        break;
      }
      if (!has_restore && creep.store.getUsedCapacity() > 0) {
        creep.memory.state = stat_carry.drop;
      }
    }
    if (stat_carry.restoreing === creep.memory.state) {
      const task_id = creep.memory.task;
      const task = room.cache.tasks.get(task_id!) as TransBaseTask;
      if (!task) {
        console.error(`TransOutTask.run_creep creep ${creep.name} task ${task_id} not found`);
      } else {
        task.do_work(creep);
      }
    }
    if (stat_carry.drop === creep.memory.state) {
      let has_drop = false;
      for (const id of room.cache.trans_in_priority) {
        const task_in = room.cache.tasks.get(id) as TransBaseTask;
        const amount_left = task_in.getAmountLeft();
        const min_amount = task_in.getMinAmount(creep);
        if (amount_left < min_amount) continue;
        creep.memory.state = stat_carry.dropping;
        task_in.reserve(creep);
        has_drop = true;
        break;
      }
      if (!has_drop && creep.store.getFreeCapacity() / cap > 0.5) {
        creep.memory.state = stat_carry.restore;
      }
    }
    if (stat_carry.dropping === creep.memory.state) {
      const task_id = creep.memory.task;
      const task = room.cache.tasks.get(task_id!) as TransBaseTask;
      if (!task) {
        console.error(`TransInTask.run_creep creep ${creep.name} task ${task_id} not found`);
      } else {
        task.do_work(creep);
      }
    }
  }
  protected _task: dc.base_task<Target>;

  protected static _id_count = 1;
  public static get next_id() {
    return TransBaseTask._id_count++;
  }
  protected _id: string;
  public get id() {
    return this._id;
  }

  public get pos() {
    return this._task.pos;
  }

  public get t_id() {
    return this._task.t_id;
  }

  public get target(): Target | null {
    return Game.getObjectById(this.t_id as Id<Target>);
  }
  public getMinAmount(c: Creep) {
    const m = this._task.min_amount;
    return m === -1 ? c.store.getFreeCapacity() : m;
  }

  public creeps: Set<Creep> = new Set();
  public last_time: number = Game.time; // last reserve time
  public get rank() {
    return this._task.rank;
  }

  public get d_time() {
    return this._task.d_time;
  }
  public get type() {
    return this._task.type;
  }

  constructor(task: dc.base_task<Target>) {
    this._id = Math.random().toString(36).substring(2, 5) + TransBaseTask.next_id;
    this._task = task;
  }
}
