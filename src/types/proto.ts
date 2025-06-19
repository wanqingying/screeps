import { RoomExtend } from "room/extend";
import { dc } from "./dc";

declare global {
  interface Room {
    init(): void;
    tick(): void;
    get_sources(): Source[];
    get_spawns(): StructureSpawn[];
    get_towers(): StructureTower[];
    is_my(): boolean;
    getRdGameTime(): number;
    extend: RoomExtend;
  }

  //   interface
}
