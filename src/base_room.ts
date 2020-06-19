import { isEmpty, findNearTarget, findNearTarget2, isNotFull } from './lib_base';

export class BaseRoom {
    private rooms: Map<string, CacheRoom> = new Map<string, CacheRoom>();

    constructor() {}
    private getRoomCache = (name: string) => {
        let target = this.rooms.get(name);
        if (!target) {
            return this.updateRoom(name);
        }
        return target;
    };

    private updateRoom = (name: string) => {
        const room = Game.rooms[name];
        if (!room) {
            return null;
        }
        const che = new CacheRoom(room);
        this.rooms.set(name, che);
        return che;
    };
    private updateState = () => {
        if (this.update_tick === Game.time) {
            return;
        }
        this.update_tick = Game.time;
        Object.values(Game.rooms).forEach(room => {
            this.rooms.set(room.name, new CacheRoom(room));
        });
    };
    private update_tick = 0;

    public static findNearNotFullExtension = (creep: Creep): StructureExtension => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.findNearNotFullExtension(creep.pos);
    };
    public static findMineLink = (creep: Creep, mine_id: string): StructureLink | undefined => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        const des = che.findMineLink(creep.pos, mine_id);
        if (des?.id) {
            return Game.getObjectById(des.id);
        }
    };
    public static findSpawnEnergyTarget = (
        creep: Creep
    ): StructureSpawn | StructureExtension | null => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.findNearNotFullSpawnOrExtension(creep.pos);
    };

    private tryUpdateState = () => {
        if (Game.time - this.update_tick > 27) {
            this.update_tick = Game.time;
            // this.updateState();
        }
    };
    private run = () => {
        this.last_run_time = Game.time;
        this.tryUpdateState();
    };
    private last_run_time = 0;
    public static cache_key = 'base_room_n';
    public static start = () => {
        let driver: BaseRoom = w_cache.get(BaseRoom.cache_key);
        if (!driver) {
            driver = new BaseRoom();
            w_cache.set(BaseRoom.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };
}

let driver: BaseRoom = w_cache.get(BaseRoom.cache_key);
if (!driver) {
    driver = new BaseRoom();
    w_cache.set(BaseRoom.cache_key, driver);
}

interface PosDesc {
    pos: any[];
    id: string;
    update_tick: number;
}
// 矿边的container
interface PosDescMine {
    pos: any[];
    id: string;
    container?: PosDesc;
    link?: PosDesc;
    update_tick: number;
}

class CacheRoom {
    private source: PosDescMine[] = [];
    private mineral: PosDesc[] = [];
    private extension: PosDesc[] = [];
    private controller: PosDescMine | undefined;
    private extractor: PosDescMine[] = [];
    private tower: PosDesc[] = [];
    private spawn: PosDesc[] = [];
    private readonly name: string;
    constructor(room: Room) {
        this.name = room.name;
        const list = room.find(FIND_STRUCTURES);
        const container = list.filter(s => s.structureType === STRUCTURE_CONTAINER);
        const link = list.filter(s => s.structureType === STRUCTURE_LINK);

        room.find(FIND_SOURCES).forEach(s => {
            const { x, y, roomName } = s.pos;
            let desc = { pos: [x, y, roomName], id: s.id, update_tick: Game.time } as PosDescMine;

            const [ct, far] = findNearTarget2<StructureContainer>(s, container);
            const [lk, far2] = findNearTarget2<StructureContainer>(s, link);

            if (far <= 2) {
                const { x, y, roomName } = ct.pos;
                desc.container = { pos: [x, y, roomName], id: ct.id, update_tick: Game.time };
            }
            if (far2 <= 2) {
                const { x, y, roomName } = lk.pos;
                desc.link = { pos: [x, y, roomName], id: lk.id, update_tick: Game.time };
            }

            this.source.push(desc);
        });
        room.find(FIND_MINERALS).forEach(s => {
            const { x, y, roomName } = s.pos;
            this.mineral.push({ pos: [x, y, roomName], id: s.id, update_tick: Game.time });
        });
        list.filter(s => s.structureType === STRUCTURE_TOWER).forEach(s => {
            const { x, y, roomName } = s.pos;
            this.tower.push({ pos: [x, y, roomName], id: s.id, update_tick: Game.time });
        });
        list.filter(s => s.structureType === STRUCTURE_SPAWN).forEach(s => {
            const { x, y, roomName } = s.pos;
            this.spawn.push({ pos: [x, y, roomName], id: s.id, update_tick: Game.time });
        });
        list.filter(s => s.structureType === STRUCTURE_EXTENSION).forEach(s => {
            const { x, y, roomName } = s.pos;
            this.extension.push({ pos: [x, y, roomName], id: s.id, update_tick: Game.time });
        });
        list.filter(s => s.structureType === STRUCTURE_EXTRACTOR).forEach(s => {
            const { x, y, roomName } = s.pos;
            let desc: PosDescMine = {
                pos: [x, y, roomName],
                id: s.id,
                update_tick: Game.time,
            } as PosDescMine;

            const [ct, far] = findNearTarget2<StructureContainer>(s, container);
            const [lk, far2] = findNearTarget2<StructureContainer>(s, link);

            if (far <= 2) {
                const { x, y, roomName } = ct.pos;
                desc.container = { pos: [x, y, roomName], id: ct.id, update_tick: Game.time };
            }
            if (far2 <= 2) {
                const { x, y, roomName } = lk.pos;
                desc.link = { pos: [x, y, roomName], id: lk.id, update_tick: Game.time };
            }

            this.extractor.push(desc);
        });
        if (room?.controller) {
            const { x, y, roomName } = room.controller.pos;
            const [near, far] = findNearTarget2<StructureContainer>(room.controller, container);
            const [lk, far2] = findNearTarget2<StructureContainer>(room.controller, link);
            const desc: PosDescMine = {
                pos: [x, y, roomName],
                id: room.controller.id,
                update_tick: Game.time,
            };

            if (far2 <= 2) {
                const { x, y, roomName } = lk.pos;
                desc.link = { pos: [x, y, roomName], id: lk.id, update_tick: Game.time };
            }

            if (far <= 2) {
                const { x, y, roomName } = near.pos;
                desc.container = {
                    pos: [x, y, roomName],
                    id: near.id,
                    update_tick: Game.time,
                };
            }
            this.controller = desc;
        }
    }

    public findNearNotFullExtension = (pos: RoomPosition): StructureExtension => {
        const empty = this.extension.map(s => Game.getObjectById(s.id)).filter(s => isNotFull(s));
        return findNearTarget(pos, empty);
    };
    public findNearNotFullSpawn = (pos: RoomPosition): StructureExtension => {
        const empty = this.spawn.map(s => Game.getObjectById(s.id)).filter(s => isNotFull(s));
        return findNearTarget(pos, empty);
    };
    public findNearNotFullSpawnOrExtension = (pos: RoomPosition): StructureExtension => {
        const ext: PosDesc[] = [].concat(this.spawn).concat(this.extension);
        const empty = ext.map(s => Game.getObjectById(s.id)).filter(s => isNotFull(s));
        return findNearTarget(pos, empty);
    };
    public findMineLink = (pos: RoomPosition, id: string): PosDesc => {
        let target = this.extractor.find(e => e.id === id);
        if (target) {
            return target.link;
        }
        target = this.source.find(s => s.id === id);
        if (target) {
            return target.link;
        }
    };
}
