interface FnType {
    fn_id: number;
    interval: boolean;
    tick: number;
}
const cache: Map<number, FnType[]> = new Map();
const fnCache = new Map<number, Function>();
let fnCount = 0;

// setTimeout
export function setTickOut(tick: number, callback: Function): number {
    fnCount++;
    const triggerTick = tick + Game.time;
    const prev = cache.get(triggerTick);
    fnCache.set(fnCount, callback);
    const task: FnType = { fn_id: fnCount, interval: false, tick: tick };
    if (Array.isArray(prev)) {
        prev.push(task);
    } else {
        cache.set(triggerTick, [task]);
    }
    return fnCount;
}
// clearTimeout
export function clearTickOut(fn_id: number) {
    fnCache.delete(fn_id);
}
// setTimeout
export function setTickInterval(tick: number, callback: Function, fn_id?: number): number {
    if (!fn_id) {
        fnCount++;
        fn_id = fnCount;
        fnCache.set(fn_id, callback);
    }
    const triggerTick = tick + Game.time;
    const prev = cache.get(triggerTick);
    const task: FnType = { fn_id: fn_id, interval: true, tick: tick };
    if (Array.isArray(prev)) {
        prev.push(task);
    } else {
        cache.set(triggerTick, [task]);
    }
    return fn_id;
}
export function clearTickInterval(fn_id: number) {
    fnCache.delete(fn_id);
}

export function load_tick_out() {
    const tickQue = cache.get(Game.time);
    cache.delete(Game.time);
    if (tickQue && Array.isArray(tickQue)) {
        tickQue.forEach(({ fn_id, interval, tick }) => {
            const fn = fnCache.get(fn_id);
            if (!fn) {
                fnCache.delete(fn_id);
                return;
            }
            try {
                fn();
            } catch (e) {
                w_utils.print('execute tick out task err');
            }

            if (interval) {
                setTickInterval(tick, fn, fn_id);
            } else {
                fnCache.delete(fn_id);
            }
        });
    }
}

let cp = Object.values(Game.creeps).find(c => c.name === 'carrier_5');
