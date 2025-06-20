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

//   export interface trans_out_task<Target extends _HasId> extends base_task<Target> {}
export interface TaskTransOutConfig<T extends _HasId> {
  type: dc.task_type;
  desc: string;
  pos: RoomPosition;
  target: Id<T>; // target id
}

export class TaskTransOut<T extends _HasId> {
  public readonly config: TaskTransOutConfig<T>;
  public readonly id = Math.random().toString(36).substring(2, 7);
  public readonly created = Game.time;

  constructor(config: TaskTransOutConfig<T>) {
    this.config = config;
  }

  public get target() {
    return Game.getObjectById(this.config.target);
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
    if (!target) {
      return dc.code_ret.err_no_target;
    }
	if()

    try {
      const g1 = task.target as any as Resource | undefined;
      const g2 = task.target as any as StructureContainer | undefined;
      let ret: ScreepsReturnCode;
      if (g1?.amount) {
        ret = creep.pickup(g1);
      } else if (g2?.store) {
        const types = Object.keys(g2.store) as ResourceConstant[];
        types.sort(() => Math.random() - 0.5);
        ret = creep.withdraw(g2, types[0]);
      }
      return ret;
    } catch (e) {
      return dc.code_ret.err_unknown;
      //skip
    } finally {
      // task.finish(creep);
    }
  }
}
