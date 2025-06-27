import { Role } from "types";
import { CacheTick, CacheId, CacheValid, CacheIds, Log } from "utils";

interface SourceExt {
  id: Id<Source>;
  pos: RoomPosition;
  energy: () => number;
  harvester?: Id<Creep> | null;
  container: { id?: Id<StructureContainer>; pos?: RoomPosition };
}

export class RoomExtend {
  public room: Room;
  constructor(room: Room) {
    this.room = room;
  }

  @CacheTick(3)
  @Log(1, "TEST")
  getRdGameTime(v: string = ""): string {
    return Game.time + Math.floor(Math.random() * 1000) + v;
  }

  @CacheIds(100)
  public get_sources(): Source[] {
    return this.room.find(FIND_SOURCES);
  }

  private _sources: Record<Id<Source>, SourceExt> = {};

  public get_sources_ext() {
    if (Object.keys(this._sources).length > 0) {
      return Object.values(this._sources);
    }

    const containers = this.room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER,
    }) as StructureContainer[];
    const sources = this.room.find(FIND_SOURCES);
    const creeps = this.room.find(FIND_MY_CREEPS);

    sources.forEach(s => {
      const container = containers.find(c => c.pos.inRangeTo(s.pos, 2));
      const creep = creeps.find(c => c.memory.target === s.id && c.memory.role === Role.harvester);
      this._sources[s.id] = {
        id: s.id,
        pos: s.pos,
        energy: () => Game.getObjectById(s.id)?.energy || 0,
        harvester: creep?.id || null,
        container: { id: container?.id || null, pos: container?.pos },
      };
    });
    return Object.values(this._sources);
  }
  public update_source_ext(id: Id<Source>, ext: Partial<SourceExt>) {
    Object.assign(this._sources[id], ext);
  }

  @CacheIds(20)
  public get_extensions(): StructureExtension[] {
    return this.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_EXTENSION,
    });
  }
  @CacheIds(20)
  public get_towers(): StructureTower[] {
    return this.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER,
    });
  }
}
