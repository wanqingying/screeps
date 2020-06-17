export class BaseMod {
    private born_tick = Game.time;
    private last_run_time = 0;
    public static cache_key = w_code.DRIVER_KEY_SPAWN_AUTO;
    constructor() {
        this.born_tick = Game.time;
    }
    private run = () => {};
    public static start = () => {
        let driver: BaseMod = w_cache.get(BaseMod.cache_key);
        if (!driver) {
            driver = new BaseMod();
            w_cache.set(BaseMod.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };

    public static method = () => {
        const driver = BaseMod.start();
    };
}
