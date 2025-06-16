import { dc, Role, stat_carry, state_updater } from "types";
import { TransBaseTask, rank_in_map, rank_out_map, TickC, TickF, max_idle_time } from "./trans_base";

export class TransInTask<Target extends _HasId = any> extends TransBaseTask<Target> {
  public static discover(room: Room) {
    // const rank_in_map = {
    //   spawn: 8,
    //   extension: 8,
    //   container_controller: 7,
    //   tower: 7,
    //   link: 6,
    //   storage: 4,
    //   container: 3,
    //   container_source: 1 // harvest source
    // };
    // discover tasks in the room
    // spawns
    const spawns = room.find(FIND_MY_SPAWNS);
    for (const spawn of spawns) {
      TransInTask.create(
        {
          pos: spawn.pos,
          t_id: spawn.id,
          rank: rank_in_map.spawn,
          type: "trans_in",
          d_time: Game.time + 0,
          min_amount: 0,
          resource_need: { [RESOURCE_ENERGY]: -1 }
        },
        room
      );
    }
    // extensions
    const extensions = room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_EXTENSION
    }) as StructureExtension[];
    for (const ext of extensions) {
      TransInTask.create(
        {
          pos: ext.pos,
          t_id: ext.id,
          rank: rank_in_map.extension,
          type: "trans_in",
          d_time: Game.time + 0,
          min_amount: 0,
          resource_need: { [RESOURCE_ENERGY]: -1 }
        },
        room
      );
    }
    // container_controller
    const ctn = Game.getObjectById(room.memory.controller?.container as Id<StructureContainer>);
    if (ctn) {
      TransInTask.create(
        {
          pos: ctn.pos,
          t_id: ctn.id,
          rank: rank_in_map.container_controller,
          type: "trans_in",
          d_time: Game.time + 50,
          min_amount: 200,
          resource_need: { [RESOURCE_ENERGY]: -1 }
        },
        room
      );
    }
    // towers
    const towers = room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER
    });
    for (const tower of towers) {
      TransInTask.create(
        {
          pos: tower.pos,
          t_id: tower.id,
          rank: rank_in_map.tower,
          type: "trans_in",
          d_time: Game.time + 24,
          min_amount: 0,
          resource_need: { [RESOURCE_ENERGY]: -1 }
        },
        room
      );
    }

    // storage
    if (room.storage) {
      TransInTask.create(
        {
          pos: room.storage.pos,
          t_id: room.storage.id,
          rank: rank_in_map.storage,
          d_time: Game.time + TickF,
          type: "trans_in",
          min_amount: 0,
          resource_need: { [RESOURCE_ENERGY]: -1 }
        },
        room
      );
    }

    TransInTask.priority(room);
  }

  public static create(t: dc.trans_in_task<any>, room: Room): TransInTask<any> {
    if (room.cache.task_in_targets.has(t.t_id)) {
      const tid = room.cache.task_in_targets.get(t.t_id) as string;
      if (room.cache.tasks.has(tid)) {
        return room.cache.tasks.get(tid) as TransInTask<any>;
      } else {
        room.cache.task_in_targets.delete(t.t_id);
      }
    }
    const task = new TransInTask(t);
    room.cache.tasks.set(task.id, task);
    room.cache.task_in_targets.set(task.t_id, task.id);
    return task;
  }

  public static priority(room: Room) {
    // update priority list
    const tasks = Array.from(room.cache.tasks.values()).filter(t => t.type === "trans_in") as TransInTask[];
    tasks.sort((a, b) => b.rank - a.rank);

    const newList: string[] = [];
    for (const task of tasks) {
      room.cache.max_rank_in = Math.max(room.cache.max_rank_in, task.rank);
      if (task.d_time - Game.time <= TickC) {
        newList.unshift(task.id);
      } else if (Game.time - task.last_time > max_idle_time) {
        newList.unshift(task.id);
      } else {
        newList.push(task.id);
      }
    }
    room.cache.trans_in_priority = newList;
  }

  protected _task: dc.trans_in_task<Target>;
  constructor(t: any) {
    super(t);
    this._task = t;
  }

  public do_work(creep: Creep) {
    const task = this;
    if (!creep.pos.isNearTo(task.pos)) {
      creep.moveTo(task.pos);
      return ERR_NOT_IN_RANGE;
    }
    try {
      const g = task.target as any;
      for (const t of Object.keys(task._task.resource_need) as ResourceConstant[]) {
        const need = task._task.resource_need[t];
        if (need === -1) {
          creep.transfer(g, t);
        } else {
          creep.transfer(g, t, need);
        }
      }
      return OK;
    } finally {
      task.finish(creep);
    }
  }

  // get the amount of resource needed for this task
  public get amount_need(): number {
    const stru = this.target as any as StructureContainer;
    if (stru?.store) {
      return stru.store.getFreeCapacity();
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
      amount_on_the_way += creep.store.getUsedCapacity();
    }
    return Math.max(0, this.amount_need - amount_on_the_way);
  }

  public reserve(creep: Creep) {
    const task = this;
    task.creeps.add(creep);
    task.last_time = Game.time;

    creep.memory.task = task.id;
  }

  public finish(creep: Creep) {
    const task = this;
    // finish pickup
    task.creeps.delete(creep);
    creep.memory.task = "";
    if (creep.store.getUsedCapacity() === 0) {
      // empty
      creep.memory.state = stat_carry.restore;
    } else {
      creep.memory.state = stat_carry.drop;
    }
  }
}
