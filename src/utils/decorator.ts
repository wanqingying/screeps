export function CacheTick(ttl: number = 0): MethodDecorator {
  return (target: any, propertyKey: string, desc: PropertyDescriptor) => {
    const original = desc.value;
    let cache = {
      tick: -1,
      _cache: null,
    };
    desc.value = function (...args: any[]) {
      if (Game.time - cache.tick >= ttl) {
        const res = original.apply(target, args);
        cache.tick = Game.time;
        cache._cache = res;
      }
      return cache._cache;
    };
  };
}

export function CacheIds(ttl: number = 0): MethodDecorator {
  return (target: any, propertyKey: string, desc: PropertyDescriptor) => {
    const original = desc.value;
    let cache = {
      tick: -1,
      _ids: [] as Id<_HasId>[],
    };
    desc.value = function (...args: any[]) {
      if (Game.time - cache.tick >= ttl) {
        const res = original.apply(target, args) as _HasId[];
        if (Array.isArray(res)) {
          cache._ids = res.map(item => item.id);
          cache.tick = Game.time;
        }
        return res;
      }
      return cache._ids.map(id => Game.getObjectById(id)) as _HasId[];
    };
  };
}

export function CacheId(ttl: number = 0): MethodDecorator {
  return (target: any, propertyKey: string, desc: PropertyDescriptor) => {
    const original = desc.value;
    let cache = {
      tick: -1,
      _id: null as Id<_HasId> | null,
    };
    desc.value = function (...args: any[]) {
      if (Game.time - cache.tick >= ttl) {
        const res = original.apply(target, args) as _HasId;
        if (res && res.id) {
          cache.tick = Game.time;
          cache._id = res.id;
        }
        return res;
      }
      return Game.getObjectById(cache._id) as _HasId | null;
    };
  };
}

interface DescConfig<T> {
  tick: number;
  result?: T;
}
export function CacheValid<T>(valid: (desc: DescConfig<T>) => boolean): MethodDecorator {
  return (target: any, propertyKey: string, desc: PropertyDescriptor) => {
    const original = desc.value;
    let cache: DescConfig<T> = {
      tick: -1,
      result: undefined,
    };
    desc.value = function (...args: any[]) {
      const isValid = valid(cache);
      if (!isValid) {
        const res = original.apply(this, args);
        cache.tick = Game.time;
        cache.result = res as T;
        return res;
      }
      return cache.result as T;

    };
  };
}

export function Log(tick = 1, prefix = ""): MethodDecorator {
  return (target: any, propertyKey: string, desc: PropertyDescriptor) => {
    const original = desc.value;
    prefix = prefix || propertyKey;
    desc.value = function (...args: any[]) {
      const res = original.apply(this, args);
      if (tick > 0 && Game.time % tick === 0) {
        console.log(`[${prefix}]: called `, ...args, `=>`, res);
      }
      return res;
    };
  };
}
