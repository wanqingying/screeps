export class Base_attack {
    private creeps_cur: [string, number][] = [];
    private readonly creeps_target = [];
    private readonly pos_a = [];
    private readonly pos_b = [];
    private atk_room_name: string;
    private readonly from: string;
    private ready: boolean = false;
    constructor() {
        const atk_from = Object.keys(w_config.rooms).find(key => {
            const s = w_config.rooms[key];
            return s.attack && s.attack.atk_name;
        });
        this.from = atk_from;
        const cfg = w_config.rooms[atk_from]?.attack;
        this.atk_room_name = cfg.atk_name;
        this.creeps_target = Array.from(cfg.creeps);
        this.pos_a = cfg.pos_a;
        this.pos_b = cfg.pos_b;
        cfg.creeps.forEach(([role, num]) => {
            this.creeps_cur.push([role, 0]);
        });
    }

    private updateState = () => {
        if (this.update_tick === Game.time) {
            return;
        }
        this.update_tick = Game.time;
        Object.values(Game.creeps).forEach(creep => {
            if (creep.memory.process !== 'attack_yes') {
                return;
            }
            let role = creep.memory.role;
            this.creeps_cur.forEach(m => {
                if (m[0] === role) {
                    m[1] += 1;
                }
            });
        });
    };

    private run_attack = (creep: Creep) => {
        const [x, y, safe_room_name] = this.pos_a;
        const [x2, y2, atk_name] = this.pos_b;
        const safe_pos = new RoomPosition(x, y, safe_room_name);
        const atk_pos = new RoomPosition(x2, y2, atk_name);
        if (creep.room.name !== safe_room_name) {
            creep.moveTo(safe_pos);
        }

        if (typeof creep.memory.mv_tick !== 'number') {
            creep.memory.mv_tick = 0;
        }
        let h = creep.hitsMax === creep.hits;
        if (creep.room.name === safe_room_name && creep.memory.mv_tick < 1 && h) {
            creep.moveTo(atk_pos);
            creep.say('to_atk');
        } else {
            creep.say('safe');
            creep.moveTo(safe_pos);
        }
        if (creep.room.name === atk_name) {
            creep.memory.mv_tick = 5;
            // creep.moveTo(safe_pos);
        }
        // creep.moveTo(safe_pos);

        if (creep.room.name === safe_room_name && creep.memory.mv_tick >= 1) {
            // creep.moveTo(safe_pos);
            // creep.say('to_safe');
            creep.say('w');
            creep.memory.mv_tick--;
        }
    };
    private run_heal = (creep: Creep) => {
        const [x, y, name] = this.pos_a;
        const pos = new RoomPosition(x, y, name);
        creep.moveTo(pos);

        let min_hits = 9999;
        let target;
        creep.room
            .find(FIND_MY_CREEPS)
            .filter(c => c.hits < c.hitsMax)
            .forEach(c => {
                if (c.hits < min_hits) {
                    min_hits = c.hits;
                    target = c;
                }
            });
        if (target) {
            // moveToTarget(creep, target, 1.3);
            creep.heal(target);
        }
    };

    private trySpawnUnit = () => {
        for (let i = 0; i < this.creeps_target.length; i++) {
            const [role, target] = this.creeps_target[i];
            const cur_m = this.creeps_cur.find(s => s[0] === role);
            const [_role, cur] = cur_m;
            if (!role) {
                return;
            }
            if (cur < target) {
                return G_SpawnAuto.spawnCreep(Game.rooms[this.from], role, {
                    process: 'attack_yes',
                });
            }
        }
        this.ready = true;
    };
    private update_tick = 0;
    private tryUpdateState = () => {
        this.updateState();
    };
    private run = () => {
        this.tryUpdateState();
        this.trySpawnUnit();
        const units = Object.values(Game.creeps).filter(c => c.memory.process === 'attack_yes');
        units.forEach(c => {
            if (c.memory.role === w_role_name.attack) {
                this.run_attack(c);
            }
            if (c.memory.role === w_role_name.heal) {
                this.run_heal(c);
            }
        });
    };
    private last_run_time = 0;
    public static cache_key = 'a_t_k_m';
    public static start = () => {
        let driver: Base_attack = w_cache.get(Base_attack.cache_key);
        if (!driver) {
            driver = new Base_attack();
            w_cache.set(Base_attack.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };
}
