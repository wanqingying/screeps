import { EventBus } from "utils";
import { dc } from "./dc";

declare global {
  interface Room {
    cache: cache_room;
  }
  interface Creep {
    cache: cache_creep;
  }

  interface cache_room {
    //   ruins_worker?: Record<string, string>;
    event: EventBus;
    init: boolean;
  }
  interface cache_creep{

  }

  interface g_cache_room {
    [roomName: string]: cache_room;
  }
}
