import { EventBus } from "utils";
import { dc } from "./dc";

declare global {
  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      cache: {
        rooms: cache_room;
        time: number;
      };
      event: EventBus;
    }
  }
}
