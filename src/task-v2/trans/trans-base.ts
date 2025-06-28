import { dc } from "types";

export interface TaskTransBaseConfig<T extends _HasId> {
  type: dc.task_type;
  desc: string;
  pos: RoomPosition;
  rank: number;
  room: string; // room name
  target: Id<T>; // target id
  amount: (this: TaskTransBase<T>) => number; // judge function for creep
  work: (creep: Creep, target: T) => number;
}

export abstract class TaskTransBase<T extends _HasId> {
  abstract readonly config: TaskTransBaseConfig<T>;
  public creeps: Set<Id<Creep>> = new Set();
  public readonly id = Math.random().toString(36).substring(2, 7);
  public readonly created = Game.time;

  public abstract get_pending(): number;
  public score = 0; // score for rank

  constructor(config: TaskTransBaseConfig<T>) {
    this.id = config.desc.substring(0, 4) + "-" + config.target.substring(0, 3);
  }

  public get target() {
    return Game.getObjectById(this.config.target);
  }

  public get desc() {
    return this.config.desc;
  }
  public get pos() {
    return this.config.pos;
  }
  public amount() {
    return this.config.amount.call(this);
  }
  public get used(): number {
    if (this.target instanceof Resource) {
      return this.target.amount;
    }
    const t2 = this.target as any as StructureContainer;
    if (t2?.store) {
      return t2.store.getUsedCapacity() || 0;
    }
    console.log("unknow target get used");
    return 0;
  }
  public get free(): number {
    const t2 = this.target as any as StructureContainer;
    if (t2?.store) {
      return t2.store.getFreeCapacity() || 0;
    }
    console.log("unknow target get free");
    return 0;
  }
  public last_time: number = -1;
  public work(creep: Creep) {
    return this.config.work(creep, this.target as T);
  }
}
