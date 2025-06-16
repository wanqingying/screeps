console.log("task index loaded");
import { setIntervalTick } from "utils";
import { TransBaseTask } from "./trans_base";
import { TransInTask } from "./trans_in";
import { TransOutTask } from "./trans_out";

export function init_trans_tasks() {
  let tk = 5;
  for (const room of Object.values(Game.rooms)) {
    TransInTask.discover(room);
    TransOutTask.discover(room);
    setIntervalTick(tk++, () => {
      TransInTask.priority(room);
	  TransOutTask.priority(room);
    });
  }
}

export { TransBaseTask, TransInTask, TransOutTask };
