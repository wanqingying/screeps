import { EventBus } from "utils";

if (!Room.prototype.hasOwnProperty("cache")) {
  Object.defineProperties(Room.prototype, {
    cache: {
      get: function () {
        if (!global.cache) {
          global.cache = { rooms: {}, time: Game.time };
        }
        if (!global.cache.rooms[this.name]) {
          global.cache.rooms[this.name] = {
            event: new EventBus(),
            init: true,
            tasks: new Map<string, any>(),
            task_in_targets: new Map<string, any>(),
            task_out_targets: new Map<string, any>(),
            max_rank_in: 6,
            max_rank_out: 6
          };
        }
        return new Proxy(global.cache.rooms[this.name], {
          get: (target, prop) => {
            let che: any = global.cache.rooms[this.name];
            return che[prop];
          },
          set: (target, prop, value) => {
            let che: any = global.cache.rooms[this.name];
            che[prop] = value;
            return true;
          }
        });
      },
      set: function (value) {
        global.cache.rooms[this.name] = value;
      }
    }
  });
}

if (!Structure.prototype.hasOwnProperty("memory")) {
  Object.defineProperties(Structure.prototype, {
    memory: {
      get: function () {
        //   if (!global.cache) {
        //     global.cache = { rooms: {}, time: Game.time };
        //   }
        if (!Memory.structure) {
          Memory.structure = {
            [this.id]: {}
          };
        }

        return new Proxy(Memory.structure[this.id], {
          get: (target, prop) => {
            let mem: any = Memory.structure[this.id];
            return mem[prop];
          },
          set: (target, prop, value) => {
            let mem: any = Memory.structure[this.id];
            mem[prop] = value;
            return true;
          }
        });
      },
      set: function (value) {
        if (!Memory.structure) {
          Memory.structure = {};
        }
        Memory.structure[this.id] = value;
      }
    }
  });
}
