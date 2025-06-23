import { TaskTransBase, TaskTransBaseConfig } from "./trans-base";
import { TaskTransIn, TaskTransInConfig } from "./trans-in";
import { TaskTransOut, TaskTransOutConfig } from "./trans-out";

const task_map = new Map<string, TaskTransBase<any>>();

export class TransTaskManager {
  public static discover(room: Room) {}
  public static discover_in(room:Room){

  }
   public static discover_out(room:Room){

  }
}
