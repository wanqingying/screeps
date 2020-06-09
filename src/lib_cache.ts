// 缓存策略
// 使用 Map 维护全局快照缓存
// 快照缓存所有对象
// filter函数从全局缓存中筛选
// 简单值/数字/字符串/布尔缓存在Memory

export interface ParamRoomFilter<K extends FindConstant> {
    room: Room;
    type: K;
    property?: FindPropertyConstant;
    property_in?: any[];
    filter?: FilterFunction<K>;
}
export function find_by_filter<T extends FindConstant>(param: ParamRoomFilter<T>) {
    const { filter } = param;
    const res = find_by_cache_key(param);
    if (filter) {
        return res.filter(filter);
    } else {
        return res;
    }
}

export function find_by_cache_key<T extends FindConstant>(param: ParamRoomFilter<T>) {
    const { room, type, property, property_in } = param;
    const key = `${room.name}_${type}_${property}_${property_in.join('#')}`;
    const cache_res = w_cache.get(key);
    let res: any[];
    if (cache_res) {
        res = cache_res;
    }
    res = room.find(type, {
        filter: item => {
            const value = item[property];
            return property_in.includes(value);
        },
    });
    w_cache.set(key, res);
    return res;
}

export function wrap_cache<T>(fn: T): T {
    function f(param, fn) {
        // const key=
    }
    return f as any;
}

export function prepare() {}
