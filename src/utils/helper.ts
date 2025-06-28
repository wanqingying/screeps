import { Log } from "./decorator";

export interface FindFilter<T> {
  filter?: (t: T) => boolean;
}
type PosObj = {
  pos: RoomPosition;
};
export class Helper {
  public static getClosestByPos<T extends PosObj>(pos: RoomPosition, targets: T[], opt?: FindFilter<T>): T | null {
    if (!targets || targets.length === 0) {
      return null;
    }
    let target: T | null = null;
    let min = Infinity;
    for (const t of targets) {
      if (opt?.filter && !opt.filter(t)) continue;
      const distance = pos.getRangeTo(t.pos);
      if (distance < min) {
        min = distance;
        target = t;
      }
    }
    return target;
  }
  public static random_obj_key<O>(obj: O): keyof O {
    const keys = Object.keys(obj) as (keyof O)[];
    return keys[Math.floor(Math.random() * keys.length)];
  }
  public static random_obj_value<O>(obj: O): O[keyof O] {
    const keys = Object.keys(obj) as (keyof O)[];
    return obj[keys[Math.floor(Math.random() * keys.length)]];
  }
  public static random_arr_value<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  public static tick_cache<T, F extends Function>(fn: F, ttl = 0): F {
    let cache = {
      tick: -1,
      _cache: null as T,
    };
    return function (...args: any[]) {
      if (Game.time - cache.tick > ttl) {
        const res = fn.apply(this, args);
        cache.tick = Game.time;
        cache._cache = res;
      }
      return cache._cache;
    } as unknown as F;
  }
  // cache by function arguments
  public static cache<T, F extends Function>(fn: F, ttl = 0): F {
    let cache = new Map<string, { tick: number; _cache: T }>();
    return function (...args: any[]) {
      const key = Array.from(arguments).join(",");
      const it = cache.get(key);
      if (it && Game.time - it.tick < ttl) {
        return it._cache;
      } else {
        const res = fn.apply(this, args);
        cache.set(key, { tick: Game.time, _cache: res });
        return res;
      }
    } as unknown as F;
  }
}

function CacheTick(ttl: number = 0): MethodDecorator {
  return (target: any, propertyKey: string, desc: PropertyDescriptor) => {
    const original = desc.value;
    let cache = {
      tick: -1,
      _cache: null,
    };
    desc.value = function () {
      if (Game.time - cache.tick >= ttl) {
        const res = original.apply(this, arguments);
        cache.tick = Game.time;
        cache._cache = res;
      }
      return cache._cache;
    };
  };
}

class Player {
  @Log(1, "outer")
  @CacheTick(3)
  @Log(1, "inner")
  getRdGameTime(v: string = ""): string {
    return Game.time + Math.floor(Math.random() * 1000) + v;
  }
}
export const player = new Player();

const obj = {
  a: 1,
  b: 2,
  c: 3,
};
console.log("random_obj_key:", Helper.random_obj_key(obj));
console.log("random_obj_value:", Helper.random_obj_value(obj));
