import { EventBus } from "utils";
import { dc } from "./dc";

declare global {
  interface Room {
    cache: cache_room;
  }

  interface cache_room {
    //   ruins_worker?: Record<string, string>;
    event: EventBus;
    init: boolean;
  }

  interface g_cache_room {
    [roomName: string]: cache_room;
  }
}
