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
export interface TaskTransInConfig<T extends _HasId> extends TaskTransBaseConfig<T> {
  needs: Partial<Record<ResourceConstant, number>>;
}

export class TaskTransIn<T extends _HasId> extends TaskTransBase<T> {
  public readonly config: TaskTransInConfig<T>;

  constructor(config: TaskTransInConfig<T>) {
    super(config);
    this.config = config;
  }

  public get_pending(): number {
    let pending = 0;
    const needs = Array.from(Object.keys(this.config.needs)) as ResourceConstant[];
    for (const creepId of this.creeps) {
      const creep = Game.getObjectById(creepId);
      if (creep && creep.store) {
        for (const t of needs) {
          pending += Math.max(0, creep.store[t] || 0);
        }
      }
    }
    return pending;
  }

  // public work(creep: Creep) {
  //   if (!creep.pos.isNearTo(this.pos)) {
  //     creep.moveTo(this.pos, {
  //       visualizePathStyle: {
  //         stroke: "#ffffff",
  //         opacity: 0.5,
  //         lineStyle: "dashed",
  //       },
  //     });
  //     return dc.code_ret.ok;
  //   }
  //   const g = this.target as any as StructureContainer;
  //   const t = Helper.random_obj_key(this.config.needs);
  //   const need = this.config.needs[t];
  //   if (!need) {
  //     creep.say("no need");
  //     return dc.code_ret.err_unknown;
  //   }
  //   if (need === -1) {
  //     creep.transfer(g, t);
  //   } else {
  //     creep.transfer(g, t, need);
  //   }
  //   return OK;
  // }
}
//--vfs-fs dropzone --vfs-archive archives_win64 --vfs-fs.
//--vfs-fs dropzone --vfs-archive patch_win64 --vfs-archive archives_win64 --vfs-archive dlc_win64 --vfs-fs.
