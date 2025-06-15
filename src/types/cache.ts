import { EventBus } from "utils";
import { dc } from "./dc";

declare global {
  interface Room {
    cache: {
      sources: Record<string, dc.srouce_task>;
    };
  }

  interface cache_room {
    [roomName: string]: {
      //   ruins_worker?: Record<string, string>;
      sources: Record<string, dc.srouce_task>;
      event: EventBus;
      init: boolean;
    };
  }
}
