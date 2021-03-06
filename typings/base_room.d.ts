declare class PosDesc<T> {
    pos: any[];
    id: string;
    readonly resType: ResourceConstant;
    update_tick: number;
    readonly target: T;
    readonly roomName: string;
    public creep_id?: string;
    // extra msg like creep id
    extra?: any;
}

declare type TypeA = Source | Mineral | StructureExtractor | StructureController;

declare class PosDescMine<T extends TypeA> extends PosDesc<T> {
    container?: PosDesc<StructureContainer>;
    link?: PosDesc<StructureLink>;
    // only for extractor
    mine?: PosDescMine<Mineral>;
}

declare class PosDescDrop<T> extends PosDesc<T> {
    resType: ResourceConstant;
    amount: number;
}

declare type TypeEnergyStructure =
    | StructureSpawn
    | StructureExtension
    | StructureTower
    | StructureStorage
    | StructureLink;
declare type TypeHarvest = Source | Mineral;

declare class G_BaseRoom {
    // get link near a mine to drop source
    public static findMineLink(creep: Creep, mine_id: string): StructureLink;
    public static findMineContainer(creep: Creep, mine_id: string): StructureContainer;
    // get not full extension or spawn
    // find order extension->spawn->tower->link_c->storage
    public static findTargetToTransfer(creep: Creep): PosDesc<TypeEnergyStructure>;
    // get or pick up
    public static findTargetToPickUpOrWithdraw(
        creep: Creep
    ): PosDesc<StructureContainer> & PosDescDrop<Resource>;
    public static findConstructionSite(creep: Creep): PosDesc<ConstructionSite>;
    public static findTargetToGetEnergy(creep: Creep): PosDesc<any>;
    public static findHarvestTargetsInRoom(room: Room): PosDescMine<TypeHarvest>[];
    public static getController(room: Room): PosDescMine<StructureController>;
    public static getRepairTarget(creep: Creep): PosDesc<AnyStructure>;
    public static getRepairWarTarget(creep: Creep): PosDesc<AnyStructure>;
    public static cache_key: 'base_room_n';
    public static start(): G_BaseRoom;
    public static findInvaderCore(room: Room): PosDesc<StructureInvaderCore> | undefined;
}

declare class G_SpawnAuto {
    public static spawnCreep(room: Room, role: role_name_key, mem?: any): void;
    public static cache_key: string;
    public static start(): G_SpawnAuto;
}

declare class G_BaseRoleRepair {
    public static run_as_repair: (creep: Creep) => void;
}
