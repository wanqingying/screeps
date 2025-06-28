import { dc } from "types";
import { TaskTransBase, TaskTransBaseConfig } from "./trans-base";
import { TaskTransIn, TaskTransInConfig } from "./trans-in";
import { TaskTransOut, TaskTransOutConfig } from "./trans-out";
import { Helper } from "utils";

export const TickC = 20; //  creep cost about 50 ticks to transfer
export const TickF = 500000; // tick forever
export const max_idle_time = 60; // max idle time for a task

// 运出优先级  任务需要 rank_out + rank_in >= 10
export const rank_out_map = {
  container_source: 8, // harvest source
  resource: 10, // droped resource
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

export class TransTaskMST {
  public static task_map = new Map<string, TaskTransBase<any>>();
  public static targets = Helper.tick_cache(function () {
    return new Set<string>(Array.from(TransTaskMST.task_map.values()).map(t => t.config.target));
  });
  public static get_task = Helper.cache(function (roomName: string, typ: dc.task_type) {
    return Array.from(TransTaskMST.task_map.values()).filter(t => {
      return t.config.room === roomName && t.config.type === typ;
    });
  });
  public static save_task(task: TaskTransBase<any>) {
    if (TransTaskMST.targets().has(task.config.target)) {
      return;
    }
    console.log("create task ", task.desc);

    this.task_map.set(task.id, task);
  }

  public static get_max_rank(roomName: string, type: dc.task_type) {
    let max_rank = 0;
    for (const task of this.task_map.values()) {
      if (task.config.room === roomName && task.config.type === type) {
        // if(task.amount)
        if (task.amount() > 0) {
          max_rank = Math.max(max_rank, task.config.rank);
        }
      }
    }
    return max_rank;
  }

  public static reset(creep: Creep, task?: TaskTransBase<any>) {
    creep.memory.state = dc.stat_carry.idle;
    creep.memory.task = "";
    if (task) {
      task.creeps.delete(creep.id);
    }
  }

  public static check(creep: Creep) {
    if (creep.store.getFreeCapacity() === 0 && creep.memory.state !== dc.stat_carry.dropping) {
      // full
      creep.memory.state = dc.stat_carry.drop;
      creep.memory.task = "";
    }
    if (creep.store.getUsedCapacity() === 0 && creep.memory.state !== dc.stat_carry.restoreing) {
      // empty
      creep.memory.state = dc.stat_carry.restore;
      creep.memory.task = "";
    }
  }
  public static run_creep(creep: Creep) {
    if (creep.spawning) return;
    if (!creep.memory.state || creep.memory.state === dc.stat_carry.idle) {
      creep.memory.state = dc.stat_carry.restore;
    }
    if (creep.memory.task && !TransTaskMST.task_map.has(creep.memory.task)) {
      creep.memory.state = dc.stat_carry.restore;
      creep.memory.task = "";
    }
    // if (creep.store.getFreeCapacity() === 0) {
    //   // full
    //   creep.memory.state = dc.stat_carry.drop;
    // }
    // if (creep.store.getUsedCapacity() === 0) {
    //   // empty
    //   creep.memory.state = dc.stat_carry.restore;
    // }

    if (creep.memory.state === dc.stat_carry.restore) {
      const tasks = TransTaskMST.get_task(creep.room.name, dc.task_type.trans_out) as TaskTransOut<any>[];
      const task_out = TransTaskMST.task_rank(tasks, creep);
      if (task_out) {
        creep.memory.task = task_out.id;
        creep.memory.state = dc.stat_carry.restoreing;
        task_out.last_time = Game.time;
        task_out.creeps.add(creep.id);
      } else {
        if (creep.store.getUsedCapacity() > 0) {
          creep.memory.state = dc.stat_carry.drop;
        }
      }
    }

    if (creep.memory.state === dc.stat_carry.restoreing) {
      const task_out = TransTaskMST.task_map.get(creep.memory.task!) as TaskTransOut<any>;
      if (task_out) {
        if (creep.pos.isNearTo(task_out.pos)) {
          task_out.work(creep);
        } else {
          creep.moveTo(task_out.pos, {
            visualizePathStyle: {
              stroke: "#ff0000",
              lineStyle: "dashed",
              opacity: 0.5,
            },
          });
          return;
        }
        if (task_out.used <= 0) {
          creep.say("t_empty");
          TransTaskMST.reset(creep, task_out);
          creep.memory.state = dc.stat_carry.restore;
        }
        if (creep.store.getFreeCapacity() === 0) {
          creep.say("full");
          TransTaskMST.reset(creep, task_out);
          creep.memory.state = dc.stat_carry.drop;
        }
      } else {
        creep.say("reset");
        return TransTaskMST.reset(creep);
      }
    }

    if (creep.memory.state === dc.stat_carry.drop) {
      const tasks = TransTaskMST.get_task(creep.room.name, dc.task_type.trans_in) as TaskTransIn<any>[];
      const task_in = TransTaskMST.task_rank(tasks, creep);
      if (task_in) {
        creep.memory.task = task_in.id;
        creep.memory.state = dc.stat_carry.dropping;
        task_in.last_time = Game.time;
        task_in.creeps.add(creep.id);
      } else {
        TransTaskMST.reset(creep);
      }
    }

    if (creep.memory.state === dc.stat_carry.dropping) {
      const task_in = TransTaskMST.task_map.get(creep.memory.task!) as TaskTransIn<any>;
      if (task_in) {
        if (creep.pos.isNearTo(task_in.pos)) {
          task_in.work(creep);
        } else {
          creep.moveTo(task_in.pos, {
            visualizePathStyle: {
              stroke: "#0000ff",
              lineStyle: "dashed",
              opacity: 0.5,
            },
          });
          return;
        }
        if (task_in.free <= 0) {
          TransTaskMST.reset(creep, task_in);
          creep.memory.state = dc.stat_carry.drop;
        }
        if (creep.store.getUsedCapacity() === 0) {
          TransTaskMST.reset(creep, task_in);
          creep.memory.state = dc.stat_carry.restore;
        }
      } else {
        return TransTaskMST.reset(creep);
      }
    }
  }

  public static task_score(t: TaskTransBase<any>, creep: Creep): number {
    const range = creep.pos.getRangeTo(t.pos);
    const amount = Math.min(t.amount(), 50);
    const time = Math.min((Game.time - t.last_time) / 3, 30);
    if (amount <= 0) return 0;
    const r1 = Math.log2(range + 1);
    // const rx = Math.min(r1, t.config.rank - 1);
    console.log(`score rank: ${t.config.rank}, range: ${r1}`);
    const rank = t.config.rank;
    return Math.min(1, rank - r1);
  }

  public static task_rank<T extends TaskTransBase<any>>(tasks: T[], creep: Creep): T {
    const score = (t: TaskTransBase<any>) => {};
    // sort tasks by rank
    const ranked = tasks
      .map(t => {
        t.score = 0; // reset score
        if (t.config.type === dc.task_type.trans_out) {
          const max_in = TransTaskMST.get_max_rank(t.config.room, dc.task_type.trans_in);
          if (max_in + t.config.rank < 10) {
            return t;
          }
          t.score = TransTaskMST.task_score(t, creep);
          return t;
        }
        if (t.config.type === dc.task_type.trans_in) {
          const to = t as unknown as TaskTransIn<any>;
          const types = Object.keys(to.config.needs) as ResourceConstant[];
          const some = types.some(r => creep.store[r] > 0);
          if (!some) {
            return t;
          }
          t.score = TransTaskMST.task_score(t, creep);
          return t;
        }
        return t;
      })
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score);
    return ranked[0];
  }

  public static run_tick() {
    for (const room of Object.values(Game.rooms)) {
      if (room.controller?.my) {
        this.cleanup(room);
        this.discover_in(room);
        this.discover_out(room);
      }
    }
  }
  public static cleanup(room: Room) {
    // cleanup tasks in the room
    for (const task of Array.from(this.task_map.values())) {
      if (task.config.room === room.name && !task.target) {
        this.task_map.delete(task.id);
      }
    }
  }
  public static discover_in(room: Room) {
    // controller container, spawn, extension, tower, storage
    const container = Game.getObjectById(room.memory.controller?.container as Id<StructureContainer>);
    if (container) {
      TransTaskMST.save_task(
        new TaskTransIn<StructureContainer>({
          pos: container.pos,
          target: container.id,
          rank: rank_in_map.container_controller,
          type: dc.task_type.trans_in,
          desc: "controller",
          room: room.name,
          amount(this: TaskTransIn<StructureContainer>) {
            const pending = this.get_pending();
            const target = this.target;
            return target.store.getFreeCapacity(RESOURCE_ENERGY) - pending;
          },
          needs: { [RESOURCE_ENERGY]: -1 }, // need energy
          work: (creep, target) => {
            return creep.transfer(target, RESOURCE_ENERGY);
          },
        }),
      );
    }
    const spawns = room.find(FIND_MY_SPAWNS);
    for (const spawn of spawns) {
      TransTaskMST.save_task(
        new TaskTransIn<StructureSpawn>({
          pos: spawn.pos,
          target: spawn.id,
          rank: rank_in_map.spawn,
          type: dc.task_type.trans_in,
          desc: "spawn",
          room: room.name,
          amount(this: TaskTransIn<StructureSpawn>) {
            const pending = this.get_pending();
            const target = this.target;
            return target.store.getFreeCapacity(RESOURCE_ENERGY) - pending;
          },
          needs: { [RESOURCE_ENERGY]: -1 }, // need energy
          work: (creep, target) => {
            return creep.transfer(target, RESOURCE_ENERGY);
          },
        }),
      );
    }
    const extensions = room.extend.get_extensions();
    for (const ext of extensions) {
      TransTaskMST.save_task(
        new TaskTransIn<StructureExtension>({
          pos: ext.pos,
          target: ext.id,
          rank: rank_in_map.extension,
          type: dc.task_type.trans_in,
          desc: "extension",
          room: room.name,
          amount(this: TaskTransIn<StructureExtension>) {
            const pending = this.get_pending();
            const target = this.target;
            return target.store.getFreeCapacity(RESOURCE_ENERGY) - pending;
          },
          needs: { [RESOURCE_ENERGY]: -1 }, // need energy
          work: (creep, target) => {
            return creep.transfer(target, RESOURCE_ENERGY);
          },
        }),
      );
    }
    const towers = room.extend.get_towers();
    for (const tower of towers) {
      TransTaskMST.save_task(
        new TaskTransIn<StructureTower>({
          pos: tower.pos,
          target: tower.id,
          rank: rank_in_map.tower,
          type: dc.task_type.trans_in,
          desc: "tower",
          room: room.name,
          amount(this: TaskTransIn<StructureTower>) {
            const pending = this.get_pending();
            const target = this.target;
            return target.store.getFreeCapacity(RESOURCE_ENERGY) - pending;
          },
          needs: { [RESOURCE_ENERGY]: -1 }, // need energy
          work: (creep, target) => {
            return creep.transfer(target, RESOURCE_ENERGY);
          },
        }),
      );
    }
    const storage = room.storage;
    if (storage) {
      const all_obj = RESOURCES_ALL.reduce((acc, r) => ({ ...acc, [r]: -1 }), {});

      TransTaskMST.save_task(
        new TaskTransIn<StructureStorage>({
          pos: storage.pos,
          target: storage.id,
          rank: rank_in_map.storage,
          type: dc.task_type.trans_in,
          desc: "storage",
          room: room.name,
          amount(this: TaskTransIn<StructureStorage>) {
            const pending = this.get_pending();
            const target = this.target;
            return target.store.getFreeCapacity() - pending;
          },
          needs: all_obj, // need all resources
          work: (creep, target) => {
            const type = Helper.random_obj_key(target.store);
            return creep.transfer(target, type as ResourceConstant);
          },
        }),
      );
    }
  }
  public static discover_out(room: Room) {
    // discover tasks in the room
    // sources
    const container_s = room.extend
      .get_sources_ext()
      .map(s => s.container)
      .map(t => Game.getObjectById(t as Id<StructureContainer>))
      .filter(Boolean) as StructureContainer[];

    for (const container of container_s) {
      TransTaskMST.save_task(
        new TaskTransOut<StructureContainer>({
          pos: container.pos,
          target: container.id,
          rank: rank_out_map.container_source,
          type: dc.task_type.trans_out,
          desc: "container_source",
          room: room.name,
          amount(this: TaskTransOut<StructureContainer>) {
            const pending = this.get_pending();
            const target = this.target;
            return target.store.getUsedCapacity() - pending;
          },
          work: (creep, target) => {
            return creep.withdraw(target, RESOURCE_ENERGY);
          },
        }),
      );
    }

    // ruins
    const ruins = room.find(FIND_RUINS, {
      filter: r => r.store.getUsedCapacity() > 0,
    });
    for (const ruin of ruins) {
      TransTaskMST.save_task(
        new TaskTransOut<Ruin>({
          pos: ruin.pos,
          target: ruin.id,
          rank: rank_out_map.ruin,
          type: dc.task_type.trans_out,
          desc: "ruin",
          room: room.name,
          amount(this) {
            const pending = this.get_pending();
            const target = this.target;
            return target.store.getUsedCapacity() - pending;
          },
          work: (creep, target) => {
            return creep.withdraw(target, RESOURCE_ENERGY);
          },
        }),
      );
    }

    // tombstones
    const tombstones = room.find(FIND_TOMBSTONES, {
      filter: t => t.store.getUsedCapacity() > 0,
    });
    for (const tb of tombstones) {
      TransTaskMST.save_task(
        new TaskTransOut<Tombstone>({
          pos: tb.pos,
          target: tb.id,
          rank: rank_out_map.tombstone,
          type: dc.task_type.trans_out,
          desc: "tombstone",
          room: room.name,
          amount(this: TaskTransOut<Tombstone>) {
            const pending = this.get_pending();
            const target = this.target;
            return target.store.getUsedCapacity() - pending;
          },
          work: (creep, target) => {
            return creep.withdraw(target, RESOURCE_ENERGY);
          },
        }),
      );
    }

    // dropped resources
    const resources = room.find(FIND_DROPPED_RESOURCES, {
      filter: r => r.amount > 20,
    });
    for (const res of resources) {
      TransTaskMST.save_task(
        new TaskTransOut<Resource>({
          pos: res.pos,
          target: res.id,
          rank: rank_out_map.resource,
          type: dc.task_type.trans_out,
          desc: "resource",
          room: room.name,
          amount(this: TaskTransOut<Resource>) {
            const pending = this.get_pending();
            const target = this.target;
            return target.amount - pending;
          },
          work: (creep, target) => {
            return creep.pickup(target);
          },
        }),
      );
    }
    // storage
    if (room.storage) {
      TransTaskMST.save_task(
        new TaskTransOut<StructureStorage>({
          pos: room.storage.pos,
          target: room.storage.id,
          rank: rank_out_map.storage,
          type: dc.task_type.trans_out,
          desc: "storage",
          room: room.name,
          amount(this: TaskTransOut<StructureStorage>) {
            const pending = this.get_pending();
            const target = this.target;
            return target.store.getUsedCapacity() - pending;
          },
          work: (creep, target) => {
            const type = Helper.random_obj_key(target.store);
            return creep.withdraw(target, type as ResourceConstant);
          },
        }),
      );
    }
  }
}
