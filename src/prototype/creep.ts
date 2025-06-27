import { BaseRole } from "role-v2";
import { TransBaseTask } from "task";
import { CreepExtend } from "extend/creep";

declare global {
  interface GlobalCache {
    creeps: Record<Id<Creep>, cache_creep>;
  }
  interface cache_creep {
    task?: TransBaseTask;
    role?: BaseRole;
  }
}

const extend_map: Record<string, CreepExtend> = {};

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
  extend: {
    get: function (this: Creep): CreepExtend {
      if (!extend_map[this.id]) {
        extend_map[this.id] = new CreepExtend(this);
      }
      const ext = extend_map[this.id];
      ext.creep = this;
      return ext;
    },
    set: function (this: Creep, value: CreepExtend) {
      extend_map[this.id] = value;
    },
  },
});

export {};
