import { EventBus } from "utils";

declare global {
  // Syntax for adding proprties to `global` (ex "global.log")
  interface GlobalCache {
    time: number;
  }
  namespace NodeJS {
    interface Global {
      cache: GlobalCache;
      event: EventBus;
      clear_1:Function
    }
  }
}

if (!global.cache) {
  global.cache = {
    time: Game.time,
    creeps: {},
    rooms: {},
  };
}

global.clear_1 = ()=>{
  
}
