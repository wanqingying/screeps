declare interface CacheSource {
    source: Source;
    creep_ids: string[];
    container: StructureContainer | undefined;
}

interface CacheRemote {
    remote_role_count?: { [name: string]: number };
}
declare interface CacheGlobalRoom {
    spawning_role?: string;
    construction_site: ConstructionSite[];
    source?: CacheSource[];
    remote_source?: CacheSource[];
    creep_role_count?: { [name: string]: number };
    remote?: { [name: string]: CacheRemote };
}
