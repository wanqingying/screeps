declare interface CacheSource {
    source: Source;
    creep_ids: string[];
    container: StructureContainer | undefined;
}

interface CacheRoomRemote {
    remote_role_count?: { [name: string]: number };
}
interface RMs {
    source: Source;
    container: StructureContainer | undefined;
    creep_names: string[];
}
declare interface CacheGlobalRoom {
    spawning_role?: string;
    construction_site: ConstructionSite[];
    source?: CacheSource[];
    remote_source?: CacheSource[];
    creep_role_count?: { [name: string]: number };
    remote?: { [name: string]: CacheRoomRemote };
    remotes?: { name: string; sources?: RMs[] }[];
}
