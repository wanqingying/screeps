import { dc } from "types";

export interface TaskTransBaseConfig<T extends _HasId> {
  type: dc.task_type;
  desc: string;
  pos: RoomPosition;
  rank: number;
  room: string; // room name
  target: Id<T>; // target id
  amount: (this: TaskTransBase<T>) => number; // judge function for creep
}

export abstract class TaskTransBase<T extends _HasId> {
  abstract readonly config: TaskTransBaseConfig<T>;
  public creeps: Set<Id<Creep>> = new Set();
  public readonly id = Math.random().toString(36).substring(2, 7);
  public readonly created = Game.time;
  // public abstract amount: number; // amount to tranfsfer, trans_in:need, trans_out:store left
  // public abstract amount_left: number;

  public abstract get_pending(): number;

  public get target() {
    return Game.getObjectById(this.config.target);
  }
  // public get amount() {
  //   return this.config.amount(this.target);
  // }
  public get desc() {
    return this.config.desc;
  }
  public get pos() {
    return this.config.pos;
  }
  public judge(creep: Creep) {
    return this.config.amount.call(this, creep);
  }
}
