//  export interface base_task<Target extends _HasId> {
//     id?: string;
//     pos: RoomPosition;
//     t_id: Id<Target>;
//     rank: number;
//     min_amount: number; // -1 eq creep capacity.  min amount to transfer
//     type: trans_type;
//     d_time: number; // deadline time , like Tombstone decay time
//     desc: string;
//   }
//   export interface trans_in_task<Target extends _HasId> extends base_task<Target> {
//     resource_need: Partial<Record<ResourceConstant, number>>;
//   }

import { dc } from "types";
import { TaskTransBase, TaskTransBaseConfig } from "./trans-base";
import { Helper } from "utils";

//   export interface trans_out_task<Target extends _HasId> extends base_task<Target> {}
export interface TaskTransOutConfig<T extends _HasId> extends TaskTransBaseConfig<T> {
  // type: dc.task_type;
  // desc: string;
  // pos: RoomPosition;
  // target: Id<T>; // target id
  // judge: (c: Creep) => boolean; // judge function for creep
}

export class TaskTransOut<T extends _HasId> extends TaskTransBase<T> {
  public readonly config: TaskTransOutConfig<T>;

  constructor(config: TaskTransOutConfig<T>) {
    super();
    this.config = config;
  }

  public get_pending(): number {
    let pending = 0;
    for (const creepId of this.creeps) {
      const creep = Game.getObjectById(creepId);
      if (creep && creep.store) {
        pending += creep.store.getFreeCapacity();
      }
    }
    return pending;
  }

  public work(creep: Creep) {
    const pos = this.config.pos;
    if (!creep.pos.isNearTo(pos)) {
      creep.moveTo(pos, {
        visualizePathStyle: {
          stroke: "#ffff00",
          opacity: 0.5,
          lineStyle: "dashed",
        },
      });
      return dc.code_ret.err_not_in_range;
    }
    const target = this.target;
    const g2 = this.target as any as StructureContainer;
    if (!target) {
      return dc.code_ret.err_no_target;
    }
    if (target instanceof Resource) {
      return creep.pickup(target);
    } else if (g2?.store) {
      const types = Object.keys(g2.store) as ResourceConstant[];
      return creep.withdraw(g2, Helper.random_arr_value(types));
    } else {
      console.log("Unsupported target type for TaskTransOut:", this.desc);
    }
    return dc.code_ret.err_unknown;
  }
}
