if (!StructureTower.prototype.hasOwnProperty("memory")) {
  Object.defineProperties(StructureTower.prototype, {
    memory: {
      get: function () {
        //   if (!global.cache) {
        //     global.cache = { rooms: {}, time: Game.time };
        //   }
        if (!Memory.tower) {
          Memory.tower = {
            [this.id]: {},
          };
        }
        if (!Memory.tower[this.id]) {
          Memory.tower[this.id] = {};
        }

        return new Proxy(Memory.tower[this.id], {
          get: (target, prop) => {
            let mem: any = Memory.tower[this.id];
            return mem[prop];
          },
          set: (target, prop, value) => {
            let mem: any = Memory.tower[this.id];
            mem[prop] = value;
            return true;
          },
        });
      },
      set: function (value) {
        if (!Memory.tower) {
          Memory.tower = {};
        }
        Memory.tower[this.id] = value;
      },
    },
  });
}
