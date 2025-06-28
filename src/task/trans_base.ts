import { dc, Role, stat_carry, state_updater } from "types";

export const TickC = 20; //  creep cost about 50 ticks to transfer
export const TickF = 500000; // tick forever
export const max_idle_time = 60; // max idle time for a task

// 运出优先级  任务需要 rank_out + rank_in >= 10
export const rank_out_map = {
  container_source: 8, // harvest source
  resource: 8, // droped resource
  ruin: 8, // ruin
  tombstone: 8,
  storage: 4,
  container: 5,
  link: 3,
  container_controller: 2,
  tower: 1,
};
// 需求优先级
export const rank_in_map = {
  spawn: 8,
  extension: 8,
  tower: 8,
  container_controller: 7,
  link: 6,
  storage: 3,
  container: 3,
  container_source: 1, // harvest source
};

// each room have one BaseTask
export abstract class TransBaseTask<Target extends _HasId = any> {
  public abstract getAmountLeft(): number;
  public abstract reserve(creep: Creep): void;
  public abstract do_work(creep: Creep): dc.code_ret;
  // public abstract finish(creep: Creep): void;
  public abstract amount: number;

  public static get_one(creep: Creep, type: dc.trans_type) {
    const room = creep.room;
    room.cache.max_rank_in = 4;
    room.cache.max_rank_out = 4;
    let debug: string[] = [];
    let list: any[] = Array.from(room.cache.tasks.values())
      .filter(t => t.target && t.getAmountLeft() > 0)
      .map(t => {
        // update max rank
        if (t.type === dc.trans_type.in) {
          room.cache.max_rank_in = Math.max(room.cache.max_rank_in, t.rank);
        }
        if (t.type === dc.trans_type.out) {
          room.cache.max_rank_out = Math.max(room.cache.max_rank_out, t.rank);
        }
        return t;
      })
      .filter(t => t.type === type)
      .map(t => {
        // filter by type
        if (t.type !== type)
          return {
            task: t,
            reason: "type",
          };
        // trans-out must have rank_in + rank_out >= 10
        if (type === dc.trans_type.out) {
          if (t.rank + room.cache.max_rank_in < 10) {
            return {
              task: t,
              reason: "rank",
            };
          }
          return { task: t, reason: "" };
        }
        // trans-in must have resource need
        if (type === dc.trans_type.in) {
          const fed = Object.keys(creep.store).some(res_type => {
            return t.resource_need[res_type] !== undefined;
          });
          if (!fed) {
            return {
              task: t,
              reason: "res_type",
            };
          } else {
            return { task: t, reason: "" };
          }
        }
        return {
          task: t,
          reason: "mis",
        };
      });
    const reasons = list.map(b => `${b.task.desc}:${b.reason}`).join(",");
    debug.push(reasons);
    list = list.filter(t => t.reason === "").map(t => t.task) as any[];
    debug.push(
      `get_one_${type} list:${list.length}, max_rank_in:${room.cache.max_rank_in}, max_rank_out:${room.cache.max_rank_out}`,
    );

    const cap = creep.store.getFreeCapacity();
    const v_list = list
      .map(t => {
        const s_time = Game.time - t.last_time;
        const s_amo = Math.min(t.getAmountLeft(), cap);
        const s_range = creep.pos.getRangeTo(t.pos);
        return {
          task: t,
          score: (s_time * 4 + s_amo / 3 + 40 - Math.min(s_range, 40)) * t.rank * t.rank,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map(t => t.task);

    debug.push(`get_one_${type}:${v_list.length}, ${v_list.slice(0, 3).map(t => t.desc)},`);

    for (const task of v_list) {
      const amount_need_left = task.getAmountLeft();
      const min_amount = task.getMinAmount(creep);
      const skip = amount_need_left <= min_amount;
      debug.push(`task_${type}_${task.desc} amount:${amount_need_left} min:${min_amount} skip:${skip}`);
      if (skip) continue;
      creep.memory.debug = debug.join(" | ");
      return task;
    }
    debug.push(`no task found ${type}`);
    creep.memory.debug = debug.join(" | ");
    return null;
  }

  public static reset(creep: Creep) {
    creep.memory.task = "";
    creep.memory.state = stat_carry.idle;
  }

  public static run_creep(creep: Creep) {
    const room = creep.room;
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
      if (creep.store.getFreeCapacity() === 0) {
        creep.memory.state = stat_carry.drop;
      } else {
        const task_out = TransBaseTask.get_one(creep, dc.trans_type.out);
        if (task_out) {
          creep.memory.state = stat_carry.restoreing;
          // task_out.reserve(creep);
          task_out.creeps.add(creep);
          task_out.last_time = Game.time;
          creep.memory.task = task_out.id;
        }
      }
    }
    if (stat_carry.restoreing === creep.memory.state) {
      const task_id = creep.memory.task;
      const task = room.cache.tasks.get(task_id!) as TransBaseTask;
      if (!task) {
        TransBaseTask.reset(creep);
      } else {
        task.do_work(creep);
        const free = creep.store.getFreeCapacity();
        if (task.amount === 0) {
          // if creep is full or task is empty, finish
          task.creeps.delete(creep.id);
          task.last_time = Game.time;
          creep.memory.task = "";
          if (free / cap > 0.7) {
            creep.memory.state = stat_carry.restore;
          } else {
            creep.memory.state = stat_carry.drop;
          }
        }
        if (creep.store.getFreeCapacity() === 0) {
          // if creep is full, change state
          task.creeps.delete(creep.id);
          creep.memory.state = stat_carry.drop;
        }
      }
    }
    if (stat_carry.drop === creep.memory.state) {
      if (creep.store.getUsedCapacity() === 0) {
        TransBaseTask.reset(creep);
        creep.memory.state = stat_carry.restore;
      } else {
        const task_in = TransBaseTask.get_one(creep, dc.trans_type.in);
        if (task_in) {
          creep.memory.state = stat_carry.dropping;
          task_in.creeps.add(creep);
          task_in.last_time = Game.time;
          creep.memory.task = task_in.id;
        }
      }
    }
    if (stat_carry.dropping === creep.memory.state) {
      const task_in = room.cache.tasks.get(creep.memory.task!) as TransBaseTask;
      if (!task_in) {
        creep.say("task_in not found");
        TransBaseTask.reset(creep);
      } else {
        creep.say(`task_in ${task_in.desc}`);
        task_in.do_work(creep);
        const free = creep.store.getFreeCapacity();
        const amo = task_in.amount;
        if (free === 0 || amo <= 0) {
          // if creep is empty or task is empty, finish
          task_in.creeps.delete(creep.id);
          creep.memory.task = "";
          task_in.last_time = Game.time;

          if (creep.store.getUsedCapacity() === 0) {
            // if creep is empty, reset state
            creep.memory.state = stat_carry.restore;
          }
        }
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
      } else {
        for (const id of new Set(task.creeps)) {
          if (!Game.getObjectById(id)) {
            task.creeps.delete(id);
          }
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

  public creeps: Set<Id<Creep>> = new Set();

  public last_time: number = Game.time; // last reserve time
  public get rank() {
    return this._task.rank;
  }

  public get resource_need() {
    return (this._task as dc.trans_in_task<any>).resource_need;
  }
  public get desc() {
    return this._task.desc;
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
