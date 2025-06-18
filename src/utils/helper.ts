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
}

const obj = {
  a: 1,
  b: 2,
  c: 3,
};
console.log("random_obj_key:", Helper.random_obj_key(obj));
console.log("random_obj_value:", Helper.random_obj_value(obj));
