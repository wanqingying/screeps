console.log("task index loaded");
import { setIntervalTick } from "utils";
import { TransBaseTask } from "./trans_base";
import { TransInTask } from "./trans_in";
import { TransOutTask } from "./trans_out";
console.log("task index loaded");

export function init_trans_tasks() {
  for (const room of Object.values(Game.rooms)) {
    TransInTask.discover(room);
    TransOutTask.discover(room);
  }

  setIntervalTick(4, () => {
    for (const room of Object.values(Game.rooms)) {
      TransBaseTask.clean_up(room);
      // TransInTask.priority(room);
      // TransOutTask.priority(room);
    }
  });

  setIntervalTick(3, () => {
    for (const room of Object.values(Game.rooms)) {
      TransInTask.discover(room);
      TransOutTask.discover(room);
      // TransBaseTask.print_priority(room);
    }
  });
}

export { TransBaseTask, TransInTask, TransOutTask };
