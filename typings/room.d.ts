declare interface Room {
    init: () => void;
    source_energy: Source_h[];
    findBy<K extends FindConstant>(type: K, filter?: FilterFunction<K>): Array<FindTypes[K]>;
    log(...p: any): void;
    spawns: StructureSpawn[];
}
