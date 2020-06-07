declare interface Room {
    init: () => void;
    source_energy: { target: Resource; harvester: string[] }[];
}
