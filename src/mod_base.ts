export class BaseMod {
    private born_tick = Game.time;
    constructor() {
        this.born_tick = Game.time;
    }

    private updateState = () => {

    };
    private update_tick=0;
    private tryUpdateState = () => {
        if (Game.time-this.update_tick>27){
            this.update_tick=Game.time
            this.updateState()
        }
    };
    private run = () => {
        this.tryUpdateState();
    };
    private last_run_time = 0;
    public static cache_key='key'
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
