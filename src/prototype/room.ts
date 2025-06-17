import { EventBus } from "utils";
import { dc } from "types";
import { TransBaseTask } from "task";

declare global {
  interface cache_room {
    tasks: Map<string, TransBaseTask<any>>;
    task_out_targets: Map<string, string>; // Record<targetId, taskId>
    task_in_targets: Map<string, string>;
    // trans_out_priority: string[];
    // trans_in_priority: string[];
    max_rank_in: number;
    max_rank_out: number;
    renew?: string;
    handle_tick_event?: boolean;
  }
}

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
            max_rank_out: 6,
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
          },
        });
      },
      set: function (value) {
        global.cache.rooms[this.name] = value;
      },
    },
  });
}

Room.prototype.tick = function (this: Room): void {
  // const events = this.getEventLog();
  // for(const event of events){
  //   switch(event.event){
  //     case EVENT_ATTACK:
  //       const b=event.data.damage;
  //   }
  // }
  // let ev2:EventItem= null as any
  // if(ev2.event === EVENT_BUILD){
  //   const b=ev2.data.targetId
  // }
};

Room.prototype.init = function (this: Room): void {
  if (!this.cache.handle_tick_event) {
    this.cache.handle_tick_event = true;
  }
};

Room.prototype.get_sources = function (this: Room): Source[] {
  const room = this;
  if (room.memory.sources) {
    return Object.keys(room.memory.sources)
      .map(id => {
        return Game.getObjectById(id as Id<Source>);
      })
      .filter(Boolean) as Source[];
  } else {
    const sources = room.find(FIND_SOURCES);
    room.memory.sources = {};
    for (const source of sources) {
      room.memory.sources[source.id] = {};
    }
    return sources;
  }
};

//todo handle new spawn construction
Room.prototype.get_spawns = function (this: Room): StructureSpawn[] {
  const room = this;
  if (room.memory.spawns) {
    return Object.keys(room.memory.spawns)
      .map(id => {
        return Game.getObjectById(id as Id<StructureSpawn>);
      })
      .filter(Boolean) as StructureSpawn[];
  } else {
    const spawns = room.find(FIND_MY_SPAWNS);
    room.memory.spawns = {};
    for (const spawn of spawns) {
      room.memory.spawns[spawn.id] = {
        stat: dc.stat_spawn.idle,
      };
    }
    return spawns;
  }
};
