declare class PosDescCls<T> {
    pos: any[];
    id: string;
    update_tick: number;
    readonly target: T;
    // extra msg like creep id
    extra?: any;
}

declare type TypeA = Source | Mineral | StructureExtractor | StructureController;

declare class PosDescMine<T extends TypeA> extends PosDescCls<T> {
    container?: PosDescCls<StructureContainer>;
    link?: PosDescCls<StructureLink>;
    // only for extractor
    mine?: PosDescMine<Mineral>;
}

declare class PosDescDrop<T> extends PosDescCls<T> {
    resType: ResourceConstant;
    amount: number;
}

declare type TypeEnergyStructure=StructureSpawn|StructureExtension|StructureTower|StructureStorage|StructureLink
declare type TypeHarvest=Source|Mineral


declare class BaseRoom {
    // get link near a mine to drop source
    public static findMineLink(creep: Creep, mine_id: string): StructureLink;
    // get not full extension or spawn
    // find order extension->spawn->tower->link_c->storage
    public static findTargetToTransferEnergy(creep: Creep): TypeEnergyStructure ;
    public static findHarvestTargetsInRoom(room: Room): PosDescMine<TypeHarvest> [];
    public static cache_key: 'base_room_n';
    public static start(): BaseRoom;
}
