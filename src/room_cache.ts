import { run_creep, run_my_room } from './lib_base';

interface StructureSite {
    pos: any[];
    stcType: StructureConstant;
    id: string;
}
interface SourceSite {
    pos: any[];
    id: string;
}

export class RoomCache {
    private update_tick = 0;
    private update_site_tick = 0;
    private structure_site: Map<string, StructureSite> = new Map<string, StructureSite>();
    public updateState = () => {
        this.update_tick = Game.time;
        // Object.values(Game.rooms).forEach(room)
    };

    private updateRoomCache = () => {};

    public tryUpdateState = (force?: boolean) => {
        if (force) {
            this.updateState();
            return;
        }
        if (Game.time - this.update_tick > 50) {
            this.updateState();
            return;
        }
    };

    private last_run_time = 0;

    public run = () => {
        this.last_run_time = Game.time;
        this.tryUpdateState();
    };
    private static cache_key = 'room_cache_global_w';
    public static start = (): RoomCache => {
        let driver: RoomCache = w_cache.get(RoomCache.cache_key);
        if (!driver) {
            driver = new RoomCache();
            w_cache.set(RoomCache.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };
}
