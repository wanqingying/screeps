declare class PosDesc<T> {
    pos: any[];
    id: string;
    update_tick: number;
    readonly target: T;
    readonly roomName:string
    public creep_id?:string
    // extra msg like creep id
    extra?: any;
}

declare type TypeA = Source | Mineral | StructureExtractor | StructureController;

declare class PosDescMine<T extends TypeA> extends PosDesc<T> {
    container?: PosDesc<StructureContainer>;
    link?: PosDesc<StructureLink>;
    // only for extractor
    mine?: PosDescMine<Mineral>;
    resType?: ResourceConstant;
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
    // get not full extension or spawn
    // find order extension->spawn->tower->link_c->storage
    public static findTargetToTransfer(creep: Creep): TypeEnergyStructure;
    // get or pick up
    public static findTargetToPickUpOrWithdraw(
        creep: Creep
    ): PosDesc<StructureContainer> | PosDescDrop<Resource>;
    public static findHarvestTargetsInRoom(room: Room): PosDescMine<TypeHarvest>[];
    public static cache_key: 'base_room_n';
    public static start(): G_BaseRoom;
}

declare class G_SpawnAuto {
    public static spawnCreep(room: Room, role: role_name_key, mem?: any): void;
    public static cache_key: string;
    public static start(): G_SpawnAuto;
}
