import { findNearTarget, findNearTarget2, isNotEmpty, isNotFull } from './lib_base';

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
    public static findMineContainer = (
        creep: Creep,
        mine_id: string
    ): StructureContainer | undefined => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.findMineContainer(creep.pos, mine_id);
    };
    // get not full extension or spawn
    // find order extension/spawn/tower->link_in->storage
    public static findTargetToTransferEnergy = (creep: Creep): PosDesc<TypeEnergyStructure> => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.findTargetToTransferEnergy(creep.pos);
    };
    public static findTargetToTransfer = (creep: Creep) => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.findTargetToTransfer(creep);
    };
    public static findTargetToPickUpOrWithdraw = (creep: Creep) => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.findTargetToPickUpOrWithdraw(creep.pos);
    };
    public static findTargetToGetEnergy = (creep: Creep) => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.findTargetToGetEnergy(creep.pos);
    };
    public static findConstructionSite = (creep: Creep) => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.findConstructionSite(creep.pos);
    };
    public static findHarvestTargetsInRoom = (room: Room) => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(room.name);
        return che.findHarvestTargets();
    };
    public static findInvaderCore = (room: Room) => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(room.name);
        return che.invader_core;
    };
    public static getRepairTarget = (creep: Creep) => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.getRepairTarget(creep.pos);
    };
    public static getRepairWarTarget = (creep: Creep) => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(creep.room.name);
        return che.getRepairWarTarget(creep.pos);
    };
    public static getController = (room: Room) => {
        const driver = BaseRoom.start();
        const che = driver.getRoomCache(room.name);
        return che.controller;
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
    public creep_id?: string;
    public resType?: ResourceConstant;
    private _target = undefined;
    public get roomName() {
        return this.pos[2];
    }
    private _up_tk = 0;
    public get target(): T {
        if (this._up_tk !== Game.time) {
            this._up_tk = Game.time;
            this._target = Game.getObjectById(this.id);
        }
        return this._target;
    }
    public set target(target: T) {
        this._target = target;
        this._up_tk = Game.time;
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
    public controller: PosDescMine<StructureController> | undefined;
    private extractor: PosDescMine<StructureExtractor>[] = [];
    private tower: PosDesc<StructureTower>[] = [];
    private spawn: PosDesc<StructureSpawn>[] = [];
    // 用于发送能量 比如发送到controller 单位搬运能量到此
    private link_in: PosDesc<StructureLink>[] = [];
    // 用于接受其他link 单位清空此link
    private link_out: PosDesc<StructureLink>[] = [];
    private drop: PosDescDrop<Resource>[] = [];
    private construction_site: PosDesc<ConstructionSite>[] = [];
    public invader_core: PosDesc<StructureInvaderCore> | undefined;
    private repair: PosDesc<AnyStructure>[] = [];
    private repairWar: PosDesc<AnyStructure>[] = [];
    private tombstone: PosDesc<Tombstone>[] = [];
    private readonly storage: PosDesc<StructureStorage> | undefined;
    private readonly name: string;
    constructor(room: Room) {
        this.name = room.name;
        const structures = room.find(FIND_STRUCTURES) as any;
        const containers: StructureContainer[] = structures.filter(
            s => s.structureType === STRUCTURE_CONTAINER
        );
        const links: StructureLink[] = structures.filter(s => s.structureType === STRUCTURE_LINK);

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
                const ctn = new PosDesc<StructureContainer>({
                    pos: [x, y, roomName],
                    id: ct.id,
                });
                ctn.resType = RESOURCE_ENERGY;
                pos.container = ctn;
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
                // always true
                if (far3 <= 2) {
                    desc.mine = mine;
                    desc.resType = mine.target.mineralType;
                }
                if (far <= 2) {
                    const { x, y, roomName } = ct.pos;
                    const pos = new PosDesc<StructureContainer>({
                        pos: [x, y, roomName],
                        id: ct.id,
                    });
                    pos.resType = mine.target.mineralType;
                    desc.mine.container = pos;
                    desc.container = pos;
                }
                if (far2 <= 2) {
                    const { x, y, roomName } = lk.pos;
                    let pos = new PosDesc<StructureLink>({ pos: [x, y, roomName], id: lk.id });
                    desc.link = pos;
                    desc.mine.link = pos;
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
        const link_in = w_config.rooms[this.name]?.link_in || [];
        link_in.forEach(id => {
            const link = links.find(lk => lk.id === id);
            if (link) {
                const { x, y, roomName } = link.pos;
                this.link_in.push(
                    new PosDesc<StructureLink>({ pos: [x, y, roomName], id: link.id })
                );
            }
        });
        const link_out = w_config.rooms[this.name]?.link_out || [];
        link_out.forEach(id => {
            const link = links.find(lk => lk.id === id);
            if (link) {
                const { x, y, roomName } = link.pos;
                this.link_out.push(
                    new PosDesc<StructureLink>({ pos: [x, y, roomName], id: link.id })
                );
            }
        });
    }
    // drop=>mine_container for carrier
    public findTargetToPickUpOrWithdraw = (
        pos: RoomPosition
    ): PosDesc<StructureContainer> | PosDescDrop<Resource> => {
        // get refresh drop
        const min_pick = 150;

        this.updateTombstone();
        if (this.tombstone.length > 0) {
            return findNearTarget(pos, this.tombstone as any);
        }

        let link_o = this.link_out.filter(l => isNotEmpty(l.target));
        if (link_o.length > 0) {
            return findNearTarget(pos, link_o) as any;
        }
        let mtn = this.extractor
            .filter(s => {
                if (!s.container) {
                    return false;
                }
                const cap = s.container.target.store.getCapacity();
                const free = s.container.target.store.getFreeCapacity();
                return cap - free > min_pick;
            })
            .map(s => s.container);

        if (mtn.length > 0) {
            return findNearTarget(pos, mtn);
        }

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
        // this.source.forEach(s => {
        // });
        if (stn.length > 0) {
            return findNearTarget(pos, stn);
        }
        return this.storage as any;
    };
    // drop=>mine_container for not carrier
    public findTargetToGetEnergy = (
        pos: RoomPosition
    ): PosDesc<StructureContainer> | PosDescDrop<Resource> => {
        // get refresh drop
        const min_pick = 150;
        let bs: PosDesc<any>[] = [].concat(this.link_out).concat(this.source.map(d => d.container));
        bs.push(this.storage);
        bs = bs.filter(t => isNotEmpty(t && t.target));
        if (bs.length > 0) {
            return findNearTarget(pos, bs);
        }

        this.updateDrop();
        const drops = this.drop.filter(d => d.amount > min_pick);
        if (drops.length > 0) {
            return findNearTarget(pos, drops);
        }
    };
    // find order extension/spawn/tower->link_in->storage
    public findTargetToTransferEnergy = (pos: RoomPosition): PosDesc<TypeEnergyStructure> => {
        const oda: PosDesc<TypeEnergyStructure>[] = []
            .concat(this.extension)
            .concat(this.spawn)
            .concat(this.tower);
        const ext = oda.filter(s => s && isNotFull(s.target));
        if (ext.length > 0) {
            return findNearTarget(pos, ext);
        }
        const link_in = this.link_in.filter(s => isNotFull(s.target));
        if (link_in.length > 0) {
            return findNearTarget(pos, link_in);
        }
        const cto_n = this.controller?.container;
        if (cto_n && isNotFull(cto_n)) {
            return cto_n as any;
        }

        if (this.storage) {
            return this.storage as any;
        }
    };
    public findTargetToTransfer = (creep: Creep): PosDesc<TypeEnergyStructure> => {
        let max_am = 0;
        let max_resType: ResourceConstant = RESOURCE_ENERGY;
        RESOURCES_ALL.forEach(resType => {
            const am = creep.store[resType];
            if (am > max_am) {
                max_am = am;
                max_resType = resType;
            }
        });
        if (max_resType === RESOURCE_ENERGY) {
            return this.findTargetToTransferEnergy(creep.pos);
        } else {
            return this.findTargetToTransferMineral(creep.pos);
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
    public findMineContainer = (pos: RoomPosition, id: string): StructureContainer => {
        let extractor = this.extractor.find(e => {
            if (!e?.container) {
                return false;
            }
            return e?.id === id || e.container?.id === id;
        });
        if (extractor && extractor.container) {
            return extractor.container.target;
        }

        let source = this.source.find(s => s?.id === id && s.container?.id);
        if (source && source.container) {
            return source.container.target;
        }
    };
    public findConstructionSite = (pos: RoomPosition) => {
        this.updateConstruction();
        return findNearTarget(pos, this.construction_site);
    };
    public getRepairTarget = (pos: RoomPosition) => {
        this.updateRepairs();
        return findNearTarget(pos, this.repair);
    };
    public getRepairWarTarget = (pos: RoomPosition) => {
        this.updateRepairs();
        let min_hit = 9999999;
        let min_target;
        this.repairWar.forEach(s => {
            if (s.target.hits < min_hit) {
                min_hit = s.target.hits;
                min_target = s;
            }
        });
        return min_target;
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
                prev.update_tick = Game.time;
            } else {
                const { x, y, roomName } = s.pos;
                const dp = new PosDescDrop<Resource>({ pos: [x, y, roomName], id: s.id });
                dp.target = s;
                dp.update_tick = Game.time;
                this.drop.push(dp);
            }
        });

        // clear not exist
        this.drop = this.drop.filter(d => d.update_tick === Game.time);
    };
    private update_site_tk = 0;
    private updateConstruction = () => {
        if (this.update_site_tk === Game.time) {
            return;
        }
        this.update_site_tk = Game.time;
        const room = Game.rooms[this.name];
        if (room) {
            room.find(FIND_MY_CONSTRUCTION_SITES).forEach(s => {
                const prev = this.construction_site.find(p => p.id === s.id);
                if (prev) {
                    prev.target = s;
                    prev.update_tick = Game.time;
                } else {
                    const { x, y, roomName } = s.pos;
                    const dp = new PosDesc<ConstructionSite>({ pos: [x, y, roomName], id: s.id });
                    dp.target = s;
                    dp.update_tick = Game.time;
                    this.construction_site.push(dp);
                }
            });
            this.construction_site = this.construction_site.filter(
                d => d.update_tick === Game.time
            );
        }
        // clear not exist
    };
    private update_tomb_tk = 0;
    private updateTombstone = () => {
        if (Game.time - this.update_tomb_tk < 9) {
            return;
        }
        this.update_site_tk = Game.time;
        const room = Game.rooms[this.name];
        if (room) {
            room.find(FIND_TOMBSTONES)
                .filter(t => {
                    let free = t.store.getFreeCapacity();
                    let cap = t.store.getCapacity(RESOURCE_ENERGY) || 0;
                    let used = cap - free;
                    return used > 150 && t.ticksToDecay > 40;
                })
                .forEach(s => {
                    const prev = this.tombstone.find(p => p.id === s.id);
                    if (prev) {
                        prev.target = s;
                        prev.update_tick = Game.time;
                    } else {
                        const { x, y, roomName } = s.pos;
                        const dp = new PosDesc<Tombstone>({ pos: [x, y, roomName], id: s.id });
                        dp.target = s;
                        dp.update_tick = Game.time;
                        this.tombstone.push(dp);
                    }
                });
            this.tombstone = this.tombstone.filter(d => d.update_tick === Game.time);
        }
    };
    private update_rp_tk = 0;
    private updateRepairs = () => {
        if (this.update_rp_tk === Game.time) {
            return;
        }
        this.update_rp_tk = Game.time;
        const room = Game.rooms[this.name];
        if (room) {
            room.find(FIND_STRUCTURES)
                .filter(s => {
                    return s.hits / s.hitsMax < 0.7;
                })
                .forEach(s => {
                    if ([STRUCTURE_RAMPART, STRUCTURE_WALL].includes(s.structureType as any)) {
                        const prev = this.repairWar.find(p => p.id === s.id);
                        if (prev) {
                            prev.target = s;
                            prev.update_tick = Game.time;
                        } else {
                            const { x, y, roomName } = s.pos;
                            const dp = new PosDesc<AnyStructure>({
                                pos: [x, y, roomName],
                                id: s.id,
                            });
                            dp.target = s;
                            dp.update_tick = Game.time;
                            this.repairWar.push(dp);
                        }
                    } else {
                        const prev = this.repair.find(p => p.id === s.id);
                        if (prev) {
                            prev.target = s;
                            prev.update_tick = Game.time;
                        } else {
                            const { x, y, roomName } = s.pos;
                            const dp = new PosDesc<AnyStructure>({
                                pos: [x, y, roomName],
                                id: s.id,
                            });
                            dp.target = s;
                            dp.update_tick = Game.time;
                            this.repair.push(dp);
                        }
                    }
                });
            this.repair = this.repair.filter(d => d.update_tick === Game.time);
            this.repairWar = this.repairWar.filter(d => d.update_tick === Game.time);
        }
    };
    updateInvaderCore = () => {
        const room = Game.rooms[this.name];
        if (room) {
            const inv = room
                .find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_INVADER_CORE })
                .pop();
            if (inv) {
                const { x, y, roomName } = inv.pos;
                let pos = new PosDesc<StructureInvaderCore>({ pos: [x, y, roomName], id: inv.id });
                pos.target = inv as any;
                this.invader_core = pos;
            }
        }
    };
    private updateState = () => {
        if (this.update_state_tick === Game.time) {
            return;
        }
        this.update_state_tick = Game.time;
        this.updateDrop();
        this.updateInvaderCore();
        this.updateTombstone();
    };
    private update_state_tick = 0;
    public tryUpdateState = () => {
        if (Game.time - this.update_state_tick > 15) {
            this.updateState();
        }
    };
}
