declare interface CacheSource {
    source: Source;
    creep_ids: string[];
    container: StructureContainer | undefined;
}
declare interface CacheGlobalRoom {
    spawning?: boolean;
    spawning_role?: string;
    construction_site: ConstructionSite[];
    source?: CacheSource[];
    creep_role_count?: { [name: string]: number };
}
