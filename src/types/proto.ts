import { dc } from "./dc";

declare global {
  interface Room {
    init(): void;
    tick(): void;
    get_sources(): Source[];
    get_spawns(): StructureSpawn[];
    get_towers(): StructureTower[];
  }

  //   interface
}
