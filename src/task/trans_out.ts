import { dc, Role, stat_carry, state_updater } from "types";
import { TransBaseTask, rank_in_map, rank_out_map, TickC, TickF, max_idle_time } from "./trans_base";

// each room have one BaseTask
export class TransOutTask<Target extends _HasId = any> extends TransBaseTask<Target> {
  public static discover(room: Room) {
    // discover tasks in the room
    // sources
    const container_s = Object.values(room.memory.sources)
      .map(s => s.container)
      .map(t => {
        return Game.getObjectById(t as Id<StructureContainer>);
      })
      .filter(Boolean) as StructureContainer[];
    for (const container of container_s) {
      const task = TransOutTask.create(
        {
          pos: container.pos,
          t_id: container.id,
          rank: rank_out_map.container_source,
          type: "trans_out",
          d_time: Game.time + TickF,
          min_amount: -1
        },
        room
      );
    }

    // ruins
    const ruins = room.find(FIND_RUINS, {
      filter: r => r.store.getUsedCapacity() > 0
    });
    for (const ruin of ruins) {
      // const time= ruin.ticksToDecay;
      const task = TransOutTask.create(
        {
          pos: ruin.pos,
          t_id: ruin.id,
          rank: rank_out_map.ruin,
          type: "trans_out",
          d_time: Game.time + ruin.ticksToDecay,
          min_amount: 50
        },
        room
      );
    }

    // tombstones
    const tombstones = room.find(FIND_TOMBSTONES, {
      filter: t => t.store.getUsedCapacity() > 0
    });
    for (const tb of tombstones) {
      const task = TransOutTask.create(
        {
          pos: tb.pos,
          t_id: tb.id,
          rank: rank_out_map.tombstone,
          type: "trans_out",
          d_time: Game.time + tb.ticksToDecay,
          min_amount: 50
        },
        room
      );
    }

    // dropped resources
    const resources = room.find(FIND_DROPPED_RESOURCES, {
      filter: r => r.amount > 20
    });
    for (const res of resources) {
      const task = TransOutTask.create(
        {
          pos: res.pos,
          t_id: res.id,
          rank: rank_out_map.resource,
          type: "trans_out",
          d_time: Game.time + Math.min(res.amount, 1000),
          min_amount: 50
        },
        room
      );
    }
    // storage
    if (room.storage) {
      const task = TransOutTask.create(
        {
          pos: room.storage.pos,
          t_id: room.storage.id,
          rank: rank_out_map.storage,
          d_time: Game.time + TickF,
          type: "trans_out",
          min_amount: 400
        },
        room
      );
    }

    TransOutTask.priority(room);
  }

  public static create(t: dc.base_task<any>, room: Room): TransOutTask<any> {
    if (room.cache.task_out_targets.has(t.t_id)) {
      const tid = room.cache.task_out_targets.get(t.t_id) as string;
      if (room.cache.tasks.has(tid)) {
        return room.cache.tasks.get(tid) as TransOutTask<any>;
      } else {
        room.cache.task_out_targets.delete(t.t_id);
      }
    }

    const task = new TransOutTask(t);
    room.cache.tasks.set(task.id, task);
    room.cache.task_out_targets.set(task.t_id, task.id);
    return task;
  }

  public static priority(room: Room) {
    // update priority list
    const tasks = Array.from(room.cache.tasks.values()).filter(t => t.type === "trans_out");
    tasks.sort((a, b) => b.rank - a.rank);

    const newList: string[] = [];
    for (const task of tasks) {
      room.cache.max_rank_out = Math.max(room.cache.max_rank_out, task.rank);
      if (task.d_time - Game.time <= TickC) {
        newList.unshift(task.id);
      } else if (Game.time - task.last_time > max_idle_time) {
        newList.unshift(task.id);
      } else {
        newList.push(task.id);
      }
    }
    room.cache.trans_out_priority = newList;
  }

  public getMinAmount(c: Creep) {
    const m = this._task.min_amount;
    return m === -1 ? c.store.getFreeCapacity() : m;
  }

  protected _task: dc.trans_out_task<Target>;
  constructor(task: dc.trans_out_task<Target>) {
    super(task);
    this._task = task;
  }

  // get trans out amount
  public get amount(): number {
    const stru = this.target as any as StructureContainer;
    const res = this.target as any as Resource;
    if (stru?.store) {
      return stru.store.getUsedCapacity();
    } else if (res?.amount) {
      return res.amount;
    } else {
      console.error(`BaseTask.amount unsupported target type ${this.target?.constructor?.name}`);
      return 0;
    }
  }

  public getAmountLeft() {
    let amount_on_the_way = 0;
    for (const creep of this.creeps) {
      if (!creep.ticksToLive || creep?.ticksToLive <= 5) {
        continue;
      }
      amount_on_the_way += creep.store.getFreeCapacity();
    }
    return Math.max(0, this.amount - amount_on_the_way);
  }

  public reserve(creep: Creep) {
    const task = this;
    task.creeps.add(creep);
    task.last_time = Game.time;

    creep.memory.task = task.id;
  }

  public do_work(creep: Creep) {
    const task = this;
    if (!creep.pos.isNearTo(task.pos)) {
      creep.moveTo(task.pos);
      return ERR_NOT_IN_RANGE;
    }
    try {
      const g1 = task.target as any as Resource | undefined;
      const g2 = task.target as any as StructureContainer | undefined;
      if (g1?.amount) {
        return creep.pickup(g1);
      } else if (g2?.store) {
        const types = Object.keys(g2.store) as ResourceConstant[];
        types.sort(() => Math.random() - 0.5);
        for (const t of types) {
          creep.withdraw(g2, t);
        }
      }
      return OK;
    } finally {
      task.finish(creep);
    }
  }

  public finish(creep: Creep) {
    const task = this;
    task.creeps.delete(creep);
    creep.memory.task = "";
    if (creep.store.getFreeCapacity() === 0) {
      // full
      creep.memory.state = stat_carry.restore;
    } else {
      creep.memory.state = stat_carry.drop;
    }
  }
}
