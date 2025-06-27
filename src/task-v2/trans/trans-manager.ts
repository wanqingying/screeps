import { dc } from "types";
import { TaskTransBase, TaskTransBaseConfig } from "./trans-base";
import { TaskTransIn, TaskTransInConfig } from "./trans-in";
import { TaskTransOut, TaskTransOutConfig } from "./trans-out";

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

export class TransTaskMST {
  public static task_map = new Map<string, TaskTransBase<any>>();
  public static save_task(task: TaskTransBase<any>) {
    this.task_map.set(task.id, task);
  }

  public static get_max_rank(room: Room, type: dc.task_type) {
    let max_rank = 0;
    for (const task of this.task_map.values()) {
      if (task.config.room === room.name && task.config.type === type) {
        max_rank = Math.max(max_rank, task.config.rank);
      }
    }
    return max_rank;
  }

  public static discover(room: Room) {
    TransTaskMST.task_map.clear();
    this.discover_in(room);
    this.discover_out(room);
  }
  public static discover_in(room: Room) {
    // controller container, spawn, extension, tower, storage
    
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
          amount(this: TaskTransOut<Ruin>) {
            const pending = this.get_pending();
            const target = this.target;
            return target.store.getUsedCapacity() - pending;
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
        }),
      );
    }
  }
}
