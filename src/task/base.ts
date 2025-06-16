//  export interface base_task {
//     id: string;
//     pos: RoomPosition;
//     target: Id<any>;
//   }
//   export interface srouce_task {
//     pos: RoomPosition;
//     amount: number;
//     pt: dc.pos_type;
//     type: ResourceConstant;
//     get_resource: (creep: Creep) => ScreepsReturnCode;
//   }

import { dc } from "types";

type TargetType = Structure | Resource | Ruin | Tombstone;

export class BaseTask<Target extends _HasId> {
  public static cache_creep: Record<string, any> = {};
  public static cache_task: Record<string, BaseTask<any>> = {};
  public static priority_list: string[] = [];

  public static discover(room:Room){
    // discover tasks in the room

  }
  public static update(){
    // update priority list

  }


  private static _id_count = 1;
  public static get next_id() {
    return BaseTask._id_count++;
  }
  private _id: string;
  public get id() {
    return this._id;
  }

  private _pos: RoomPosition;
  public get pos() {
    return this._pos;
  }

  private _t_id: Id<Target>;
  public get t_id() {
    return this._t_id;
  }

  private _r_type: ResourceConstant;
  public get resource_type(): ResourceConstant {
    return this._r_type;
  }

  private _target: Target | null = null;
  public get target(): Target | null {
    if (!this._target) {
      this._target = Game.getObjectById(this._t_id as Id<Target>);
    }
    return this._target;
  }

  public creeps: Set<Creep> = new Set();

  constructor(task: dc.base_task<Target>) {
    this._id = Math.random().toString(36).substring(2, 5) + BaseTask.next_id;
    this._pos = task.pos;
    this._t_id = task.t_id;
    this._r_type = task.resource_type || RESOURCE_ENERGY;
  }

  public get amount(): number {
    const g = this.target;
    if ((g as unknown as StructureStorage)?.store) {
      return (g as unknown as StructureStorage).store[this._r_type] || 0;
    } else if ((g as any as Resource)?.amount) {
      return (g as any as Resource).amount || 0;
    } else {
      console.error(`BaseTask.amount unsupported target type ${g?.constructor.name}`);
      return 0;
    }
  }

  public reserve(creep: Creep) {
    this.creeps.add(creep);
    creep.memory.task = this.id;
  }

  public pickup(creep: Creep) {
    try {
      const g = this.target;
      if (this.target instanceof Resource) {
        return creep.pickup(this.target);
      }
      if (g instanceof Structure || g instanceof Tombstone || g instanceof Ruin) {
        return creep.withdraw(g, this._r_type);
      } else {
        console.error(`BaseTask.pickup unsupported target type ${g?.constructor.name}`);
        return ERR_INVALID_TARGET;
      }
    } finally {
      this.finish(creep);
    }
  }
  private finish(creep: Creep) {
    this.creeps.delete(creep);
    creep.memory.task = "";
  }
}
