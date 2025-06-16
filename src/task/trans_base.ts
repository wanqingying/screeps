import { dc, Role, stat_carry, state_updater } from "types";
// import { TransInTask } from "./trans_in";
// import { TransOutTask } from "./trans_out";
declare global {
  interface cache_room {
    tasks: Map<string, TransBaseTask<any>>;
    task_out_targets: Map<string, string>; // Record<targetId, taskId>
    task_in_targets: Map<string, string>;
    // trans_out_priority: string[];
    // trans_in_priority: string[];
    max_rank_in: number;
    max_rank_out: number;
    renew?: string;
  }
}

export const TickC = 20; //  creep cost about 50 ticks to transfer
export const TickF = 500000; // tick forever
export const max_idle_time = 60; // max idle time for a task

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

  public static get_one(creep: Creep, type: dc.trans_type) {
    const room = creep.room;
    room.cache.max_rank_in = 4;
    room.cache.max_rank_out = 4;
    let list = Array.from(room.cache.tasks.values())
      .filter(t => t.type === type && t.getAmountLeft() > 0)
      .map(t => {
        if (type === dc.trans_type.in) {
          room.cache.max_rank_in = Math.max(room.cache.max_rank_in, t.rank);
        }
        if (type === dc.trans_type.out) {
          room.cache.max_rank_out = Math.max(room.cache.max_rank_out, t.rank);
        }
        return t;
      })
      .filter(t => {
        if (type === dc.trans_type.out) {
          return t.rank + room.cache.max_rank_in >= 10;
        }
        return true;
      });
    const cap = creep.store.getFreeCapacity();
    const v_list = list
      .map(t => {
        const s_time = Game.time - t.last_time;
        const s_amo = Math.min(t.getAmountLeft(), cap);
        const s_range = creep.pos.getRangeTo(t.pos);
        return {
          task: t,
          score: (s_time + s_amo + 40 - s_range) * t.rank * t.rank
        };
      })
      .sort((a, b) => b.score - a.score)
      .map(t => t.task);
    for (const task of v_list) {
      const amount_need_left = task.getAmountLeft();
      const min_amount = task.getMinAmount(creep);
      if (amount_need_left <= min_amount) continue;
      return task;
    }
    return null;
  }

  public static reset(creep: Creep) {
    creep.memory.task = "";
    creep.memory.state = stat_carry.idle;
  }

  public static run_creep(creep: Creep) {
    const room = creep.room;
    const max_rank_in = room.cache.max_rank_in;
    if (Game.time % 3 === 0) {
      creep.say(creep.memory.state || "noop");
    }
    const cap = creep.store.getCapacity();
    if (creep.memory.role !== Role.carry) {
      return console.log(`TransOutTask.run_creep creep ${creep.name} role is not carry`);
    }
    if (creep.spawning) return;
    if (creep.memory.task && !room.cache.tasks.has(creep.memory.task)) {
      TransBaseTask.reset(creep);
    }
    if (creep.memory.state === stat_carry.idle || !creep.memory.state) {
      creep.memory.state = stat_carry.restore;
    }

    if (stat_carry.restore === creep.memory.state) {
      const task_out = TransBaseTask.get_one(creep, dc.trans_type.out);
      if (task_out) {
        creep.memory.state = stat_carry.restoreing;
        task_out.reserve(creep);
      }

      // if (!task_out && creep.store.getUsedCapacity() > 0) {
      //   creep.memory.state = stat_carry.drop;
      // }
      if (creep.store.getFreeCapacity() === 0) {
        creep.memory.state = stat_carry.drop;
      }
    }
    if (stat_carry.restoreing === creep.memory.state) {
      const task_id = creep.memory.task;
      const task = room.cache.tasks.get(task_id!) as TransBaseTask;
      if (!task) {
        console.log(`TransOutTask.run_creep creep ${creep.name} task ${task_id} not found`);
        TransBaseTask.reset(creep);
      } else {
        task.do_work(creep);
      }
    }
    if (stat_carry.drop === creep.memory.state) {
      const task_in = TransBaseTask.get_one(creep, dc.trans_type.in);
      if (task_in) {
        creep.memory.state = stat_carry.dropping;
        task_in.reserve(creep);
      }

      if (creep.store.getUsedCapacity() === 0) {
        creep.memory.state = stat_carry.restore;
      }
    }
    if (stat_carry.dropping === creep.memory.state) {
      const task_id = creep.memory.task;
      const task = room.cache.tasks.get(task_id!) as TransBaseTask;
      if (!task) {
        console.log(`TransInTask.run_creep creep ${creep.name} task ${task_id} not found`);
        TransBaseTask.reset(creep);
      } else {
        task.do_work(creep);
      }
    }
  }

  public static clean_up(room: Room) {
    // clean up tasks in the room
    const tasks = room.cache.tasks;
    const entry = Array.from(tasks.entries());
    for (const [id, task] of entry) {
      const obj = Game.getObjectById(task.t_id as Id<any>);
      if (!obj) {
        room.cache.tasks.delete(id);
        if (task.type === dc.trans_type.in) {
          room.cache.task_in_targets.delete(task.t_id);
        }
        if (task.type === dc.trans_type.out) {
          room.cache.task_out_targets.delete(task.t_id);
        }
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
