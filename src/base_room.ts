import { findNearTarget, findNearTarget2, isNotFull } from './lib_base';

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
    // get link near a mine to drop source
    public static findMineLink = (creep: Creep, mine_id: string): StructureLink | undefined => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.findMineLink(creep.pos, mine_id);
    };
    // get not full extension or spawn
    // find order extension/spawn/tower->link_c->storage
    public static findTargetToTransferEnergy = (creep: Creep): PosDesc<TypeEnergyStructure> => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.findTargetToTransferEnergy(creep.pos);
    };
    public static findTargetToTransfer = (creep:Creep) => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.findTargetToTransfer(creep);
    };
    public static findTargetToPickUpOrWithdraw = (creep:Creep) => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.findTargetToPickUpOrWithdraw(creep.pos);
    };
    public static findHarvestTargetsInRoom = (room: Room) => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(room.name);
        return che.findHarvestTargets();
    };

    private tryUpdateState = () => {
        Array.from(this.rooms.values()).forEach(che => {
            che.tryUpdateState();
        });
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
global.G_BaseRoom = BaseRoom;

let driver: BaseRoom = w_cache.get(BaseRoom.cache_key);
if (!driver) {
    driver = new BaseRoom();
    w_cache.set(BaseRoom.cache_key, driver);
}

class PosDesc<T> {
    constructor({ pos, id }) {
        this.pos = pos;
        this.id = id;
    }
    public readonly pos: any[];
    public readonly id: string;
    public update_tick: number = 0;
    public extra: any;
    private _target = undefined;
    public get target(): T {
        if (this.update_tick !== Game.time) {
            this.update_tick = Game.time;
            this._target = Game.getObjectById(this.id);
        }
        return this._target;
    }
    public set target(target: T) {
        this._target = target;
        this.update_tick = Game.time;
    }
}

type TypeA = Source | Mineral | StructureExtractor | StructureController;
declare type HarvestType = Source | Mineral;

class PosDescMine<T extends TypeA> extends PosDesc<T> {
    constructor({ pos, id }) {
        super({ pos, id });
    }
    container?: PosDesc<StructureContainer>;
    link?: PosDesc<StructureLink>;
    // only for extractor
    mine?: PosDescMine<Mineral>;
    resType?: ResourceConstant;
}

class PosDescDrop<T> extends PosDesc<T> {
    constructor({ pos, id }) {
        super({ pos, id });
    }
    resType: ResourceConstant;
    amount: number;
}

class CacheRoom {
    private source: PosDescMine<Source>[] = [];
    private mineral: PosDesc<Mineral>[] = [];
    private extension: PosDesc<StructureExtension>[] = [];
    private controller: PosDescMine<StructureController> | undefined;
    private extractor: PosDescMine<StructureExtractor>[] = [];
    private tower: PosDesc<StructureTower>[] = [];
    private spawn: PosDesc<StructureSpawn>[] = [];
    private link_c: PosDesc<StructureLink>[] = [];
    private drop: PosDescDrop<Resource>[] = [];
    private readonly storage: PosDesc<StructureStorage> | undefined;
    private readonly name: string;
    constructor(room: Room) {
        this.name = room.name;
        const structures = room.find(FIND_STRUCTURES) as any;
        const containers:StructureContainer[] = structures.filter(s => s.structureType === STRUCTURE_CONTAINER);
        const links:StructureLink[] = structures.filter(s => s.structureType === STRUCTURE_LINK) ;

        if (room.storage) {
            const { x, y, roomName } = room.storage.pos;
            this.storage = new PosDesc<StructureStorage>({
                pos: [x, y, roomName],
                id: room.storage.id,
            });
        }
        room.find(FIND_SOURCES).forEach(s => {
            const { x, y, roomName } = s.pos;
            const pos = new PosDescMine<Source>({ pos: [x, y, roomName], id: s.id });
            const [ct, far] = findNearTarget2<StructureContainer>(s, containers);
            const [lk, far2] = findNearTarget2<StructureLink>(s, links);
            if (far <= 2) {
                const { x, y, roomName } = ct.pos;
                pos.container = new PosDesc<StructureContainer>({
                    pos: [x, y, roomName],
                    id: ct.id,
                });
            }
            if (far2 <= 2) {
                const { x, y, roomName } = lk.pos;
                pos.link = new PosDesc<StructureLink>({ pos: [x, y, roomName], id: lk.id });
            }
            this.source.push(pos);
        });
        room.find(FIND_MINERALS).forEach(s => {
            const { x, y, roomName } = s.pos;
            this.mineral.push(
                new PosDesc<Mineral>({ pos: [x, y, roomName], id: s.id })
            );
        });
        structures
            .filter(s => s.structureType === STRUCTURE_TOWER)
            .forEach(s => {
                const { x, y, roomName } = s.pos;
                this.tower.push(
                    new PosDesc<StructureTower>({ pos: [x, y, roomName], id: s.id })
                );
            });
        structures
            .filter(s => s.structureType === STRUCTURE_SPAWN)
            .forEach(s => {
                const { x, y, roomName } = s.pos;
                this.spawn.push(
                    new PosDesc<StructureSpawn>({ pos: [x, y, roomName], id: s.id })
                );
            });
        structures
            .filter(s => s.structureType === STRUCTURE_EXTENSION)
            .forEach(s => {
                const { x, y, roomName } = s.pos;
                this.extension.push(
                    new PosDesc<StructureExtension>({ pos: [x, y, roomName], id: s.id })
                );
            });
        structures
            .filter(s => s.structureType === STRUCTURE_EXTRACTOR)
            .forEach(s => {
                const { x, y, roomName } = s.pos;
                let desc: PosDescMine<StructureExtractor> = new PosDescMine<StructureExtractor>({
                    pos: [x, y, roomName],
                    id: s.id,
                });
                const [ct, far] = findNearTarget2<StructureContainer>(s, containers);
                const [lk, far2] = findNearTarget2<StructureLink>(s, links);
                const [mine, far3] = findNearTarget2<PosDescMine<Mineral>>(s, this.mineral);
                if (far <= 2) {
                    const { x, y, roomName } = ct.pos;
                    desc.container = new PosDesc<StructureContainer>({
                        pos: [x, y, roomName],
                        id: ct.id,
                    });
                }
                if (far2 <= 2) {
                    const { x, y, roomName } = lk.pos;
                    desc.link = new PosDesc<StructureLink>({ pos: [x, y, roomName], id: lk.id });
                }
                // always true
                if (far3 <= 2) {
                    desc.mine = mine;
                    desc.resType = mine.target.mineralType;
                }
                this.extractor.push(desc);
            });
        if (room?.controller) {
            const { x, y, roomName } = room.controller.pos;
            const [near, far] = findNearTarget2<StructureContainer>(room.controller, containers);
            const [lk, far2] = findNearTarget2<StructureLink>(room.controller, links);
            const desc: PosDescMine<StructureController> = new PosDescMine<StructureController>({
                pos: [x, y, roomName],
                id: room.controller.id,
            });
            if (far2 <= 2) {
                const { x, y, roomName } = lk.pos;
                desc.link = new PosDesc({ pos: [x, y, roomName], id: lk.id });
            }
            if (far <= 2) {
                const { x, y, roomName } = near.pos;
                desc.container = new PosDesc<StructureContainer>({
                    pos: [x, y, roomName],
                    id: near.id,
                });
            }
            this.controller = desc;
        }
        const link_c = w_config.rooms[this.name]?.link_c || [];
        link_c.forEach(id => {
            const link = links.find(lk => lk.id === id);
            if (link) {
                const { x, y, roomName } = link.pos;
                this.link_c.push(
                    new PosDesc<StructureLink>({ pos: [x, y, roomName], id: link.id })
                );
            }
        });
    }
    // drop=>mine_container
    public findTargetToPickUpOrWithdraw = (
        pos: RoomPosition
    ): PosDesc<StructureContainer> | PosDescDrop<Resource> => {
        // get refresh drop
        const min_pick = 150;
        this.updateDrop();
        const drops = this.drop.filter(d => d.amount > min_pick);
        if (drops.length > 0) {
            return findNearTarget(pos, drops);
        }
        let stn = this.source
            .filter(s => {
                if (!s.container) {
                    return false;
                }
                return s.container.target.store.energy > min_pick;
            })
            .map(s => s.container);
        if (stn.length > 0) {
            return  findNearTarget(pos, stn);
        }
        let mtn = this.extractor
            .filter(s => {
                if (!s.container) {
                    return false;
                }
                return s.container.target.store.getUsedCapacity(s.resType) > min_pick;
            })
            .map(s => s.container);
        if (mtn.length > 0) {
            return findNearTarget(pos, stn);
        }
    };
    // find order extension/spawn/tower->link_c->storage
    public findTargetToTransferEnergy = (pos: RoomPosition): PosDesc<TypeEnergyStructure> => {
        const oda: PosDesc<TypeEnergyStructure>[] = []
            .concat(this.extension)
            .concat(this.spawn)
            .concat(this.tower);
        const ext = oda.filter(s => s && isNotFull(s.target));
        if (ext.length > 0) {
            return findNearTarget(pos, ext);
        }
        const link_c = this.link_c.filter(s => isNotFull(s.target));
        if (link_c.length > 0) {
            return findNearTarget(pos, link_c);
        }
        if (this.storage) {
            return this.storage as any;
        }
    };
    public findTargetToTransfer = (creep:Creep):PosDesc<TypeEnergyStructure> => {
        let max_am=0;
        let max_resType:ResourceConstant=RESOURCE_ENERGY;
        RESOURCES_ALL.forEach(resType=>{
            const am=creep.store[resType];
            if (am>max_am){
                max_am=am
                max_resType=resType;
            }
        })
        if (max_resType===RESOURCE_ENERGY){
            return this.findTargetToTransferEnergy(creep.pos)
        }else {
            return this.findTargetToTransferMineral(creep.pos)
        }
    };
    public findTargetToTransferMineral = (pos: RoomPosition): PosDesc<StructureStorage> => {
        return this.storage;
    };
    public findHarvestTargets = (): PosDescMine<HarvestType>[] => {
        return [].concat(this.source).concat(this.extractor.map(e => e.mine));
    };
    public findMineLink = (pos: RoomPosition, id: string): StructureLink => {
        let extractor = this.extractor.find(e => {
            if (!e?.link) {
                return false;
            }
            return e?.id === id || e.mine?.id === id;
        });
        if (extractor && extractor.link) {
            return extractor.link.target;
        }
        let source = this.source.find(s => s?.id === id && s.link?.id);
        if (source && source.link) {
            return source.link.target;
        }
    };
    private update_drop_tk = 0;
    private updateDrop = () => {
        if (Game.time === this.update_drop_tk) {
            return;
        }
        this.update_drop_tk = Game.time;
        const room = Game.rooms[this.name];
        if (!room) {
            return;
        }
        room.find(FIND_DROPPED_RESOURCES).forEach(s => {
            const prev = this.drop.find(p => p.id === s.id);
            if (prev) {
                prev.target = s;
                prev.resType = s.resourceType;
                prev.amount = s.amount;
            } else {
                const { x, y, roomName } = s.pos;
                const dp = new PosDescDrop<Resource>({ pos: [x, y, roomName], id: s.id });
                dp.target = s;
                this.drop.push(dp);
            }
        });

        // clear not exist
        this.drop = this.drop.filter(d => d.update_tick === Game.time);
    };
    private updateState = () => {
        if (this.update_state_tick === Game.time) {
            return;
        }
        this.update_state_tick = Game.time;
        this.updateDrop();
    };
    private update_state_tick = 0;
    public tryUpdateState = () => {
        if (Game.time - this.update_state_tick > 8) {
            this.updateState();
        }
    };
}
