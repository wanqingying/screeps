import { EventBus } from "utils";

Object.defineProperties(Room.prototype, {
  cache: {
    get: function () {
      if (!global.cache) {
        global.cache = { rooms: {}, time: Game.time };
      }
      if (!global.cache.rooms[this.name]) {
        global.cache.rooms[this.name] = {
          sources: {},
          event: new EventBus()
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
