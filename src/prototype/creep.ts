import { BaseRole } from "role-v2";
import { TransBaseTask } from "task";

declare global {
  interface GlobalCache {
    creeps: Record<Id<Creep>, cache_creep>;
  }
  interface cache_creep {
    task?: TransBaseTask;
    role?: BaseRole;
  }
}

if (!Creep.prototype.hasOwnProperty("cache")) {
  Object.defineProperties(Creep.prototype, {
    cache: {
      get: function () {
        if (!global.cache.creeps[this.id]) {
          global.cache.creeps[this.id] = {
            task: null,
          };
        }
        let che: cache_creep = global.cache.creeps[this.id];
        return new Proxy(che, {
          get: (target, prop) => {
            return che[prop];
          },
          set: (target, prop, value) => {
            che[prop] = value;
            return true;
          },
        });
      },
      set: function (value) {
        global.cache.creeps[this.id] = value;
      },
    },
  });
}

export {};
