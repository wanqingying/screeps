import { dc, Role, stat_carry, state_updater } from "types";
import { TransBaseTask, rank_in_map, rank_out_map, TickC, TickF, max_idle_time } from "./trans_base";

export class TransInTask<Target extends _HasId = any> extends TransBaseTask<Target> {
  public static discover(room: Room) {
    // discover tasks in the room
    // spawns
    const spawns = room.find(FIND_MY_SPAWNS);
    for (const spawn of spawns) {
      TransInTask.create(
        {
          pos: spawn.pos,
          t_id: spawn.id,
          rank: rank_in_map.spawn,
          type: dc.trans_type.in,
          d_time: Game.time + 0,
          min_amount: 0,
          resource_need: { [RESOURCE_ENERGY]: -1 },
          desc: "spawn",
        },
        room,
      );
    }
    // extensions
    const extensions = room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_EXTENSION,
    }) as StructureExtension[];
    for (const ext of extensions) {
      TransInTask.create(
        {
          pos: ext.pos,
          t_id: ext.id,
          rank: rank_in_map.extension,
          type: dc.trans_type.in,
          d_time: Game.time + 0,
          min_amount: 0,
          resource_need: { [RESOURCE_ENERGY]: -1 },
          desc: "extension",
        },
        room,
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
          type: dc.trans_type.in,
          d_time: Game.time + 50,
          min_amount: 200,
          resource_need: { [RESOURCE_ENERGY]: -1 },
          desc: "container_controller",
        },
        room,
      );
    }
    // towers
    const towers = room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER,
    });
    for (const tower of towers) {
      TransInTask.create(
        {
          pos: tower.pos,
          t_id: tower.id,
          rank: rank_in_map.tower,
          type: dc.trans_type.in,
          d_time: Game.time + 24,
          min_amount: 0,
          resource_need: { [RESOURCE_ENERGY]: -1 },
          desc: "tower",
        },
        room,
      );
    }

    // storage
    if (room.storage) {
      const all_obj = RESOURCES_ALL.reduce((acc, r) => ({ ...acc, [r]: -1 }), {});
      TransInTask.create(
        {
          pos: room.storage.pos,
          t_id: room.storage.id,
          rank: rank_in_map.storage,
          d_time: Game.time + TickF,
          type: dc.trans_type.in,
          min_amount: 0,
          resource_need: all_obj,
          desc: "storage_in",
        },
        room,
      );
    }
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

  protected _task: dc.trans_in_task<Target>;
  constructor(t: any) {
    super(t);
    this._task = t;
  }

  public do_work(creep: Creep) {
    const task = this;
    if (!creep.pos.isNearTo(task.pos)) {
      creep.moveTo(task.pos, {
        visualizePathStyle: {
          stroke: "#ffffff",
          opacity: 0.5,
          lineStyle: "dashed",
        },
      });
      return dc.code_ret.ok;
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
    } catch (e) {
      console.log(`TransInTask.do_work error: ${e}, task: ${task.id}, target: ${task.t_id}, creep: ${creep.name}`);
      return dc.code_ret.err_unknown;
    }
  }

  // get the amount of resource needed for this task
  public get amount(): number {
    const stru = this.target as any as StructureContainer;
    const types = Object.keys(this._task.resource_need);
    if (stru?.store) {
      return types.reduce((s, t) => {
        return s + (stru.store.getFreeCapacity(t as ResourceConstant) || 0);
      }, 0);
    } else {
      console.log(`BaseTask.amount_need unsupported target-${this.id} ${this.desc} ${JSON.stringify(this.target)}`);
      return 0;
    }
  }

  // get left amound needed
  public getAmountLeft() {
    let amount_on_the_way = 0;
    for (const creep of new Set(this.creeps)) {
      if (creep.memory.task !== this.id) {
        this.creeps.delete(creep);
        continue;
      }
      amount_on_the_way += creep.store.getUsedCapacity();
    }
    return Math.max(0, this.amount - amount_on_the_way);
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
    task.last_time = Game.time;
    if (creep.store.getUsedCapacity() === 0) {
      // empty
      creep.memory.state = stat_carry.restore;
    } else {
      creep.memory.state = stat_carry.drop;
    }
  }
}
