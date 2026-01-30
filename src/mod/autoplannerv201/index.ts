import { RootObj } from "src/base/RootObj";
import "./RoomVisual";
import "./planner";

export class AutoPlannerV201 extends RootObj {
  private isClearUnPlanedRoads = true;
  private seePlan = false;
  private prefix = "[autoplanner]";

  constructor() {
    super();
    this.log("AutoPlannerV201 initialized");
    this.planRoom("W8N7");
  }

  private planRoom(roomName: string) {
    //@ts-ignore
    runPlan(roomName);
    //@ts-ignore
    savePlanToMemory(roomName);
    //@ts-ignore
    RP(roomName);
  }

  private construction(roomName: string) {
    const room = Game.rooms[roomName];
    if (!room) return console.log("no room find ", roomName);

    const plan = Memory.roomPlanner[roomName];
    if (!plan) return console.log("no plan in memory ", roomName);

    const structures = room.find(FIND_MY_STRUCTURES);
    const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
    let builtCount = 0;

    builtCount += this.buildPlannedRoads(room, plan.layout.road || []);
    if (builtCount >= 4) return;

    if (this.isClearUnPlanedRoads) {
      this.clearUnplannedRoads(room, plan.layout.road || []);
    }

    builtCount += this.buildPlannedExtensions(room, plan.layout.extension || [], structures, constructionSites);
    if (builtCount >= 4) return;

    builtCount += this.buildPlannedStorage(room, plan.layout.storage?.[0]);
  }

  private buildPlannedRoads(room: Room, planRoads: { x: number; y: number }[]): number {
    let builtRoads = 0;
    for (const pos of planRoads) {
      const posAt = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
      if (posAt.length > 0) continue;
      const csAt = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y);
      if (csAt.length > 0) continue;
      const res = room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
      if (res === OK) {
        builtRoads++;
      }
    }
    return builtRoads;
  }

  private clearUnplannedRoads(room: Room, planRoads: { x: number; y: number }[]) {
    const planRoadSet = new Set(planRoads.map(p => `${p.x},${p.y}`));
    const existingRoads = room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_ROAD,
    });
    for (const road of existingRoads) {
      const key = `${road.pos.x},${road.pos.y}`;
      if (!planRoadSet.has(key)) {
        road.destroy();
      }
    }
  }

  private buildPlannedExtensions(
    room: Room,
    planExtensions: { x: number; y: number }[],
    structures: Structure[],
    constructionSites: ConstructionSite[],
  ): number {
    const planExtSet = new Set(planExtensions.map(p => `${p.x},${p.y}`));
    const existingExts = structures.filter(s => s.structureType === STRUCTURE_EXTENSION);
    const existExtCs = constructionSites.filter(s => s.structureType === STRUCTURE_EXTENSION).length;
    let allowDestroy = 2 - existExtCs;
    if (allowDestroy > 0) {
      for (const ext of existingExts) {
        const key = `${ext.pos.x},${ext.pos.y}`;
        if (!planExtSet.has(key) && allowDestroy > 0) {
          ext.destroy();
          allowDestroy--;
          if (allowDestroy <= 0) break;
        }
      }
    }
    let builtExts = 0;
    for (const pos of planExtensions) {
      const posAt = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
      if (posAt.length > 0) continue;
      const csAt = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y);
      if (csAt.length > 0) continue;

      const maxLimit = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller!.level];
      if (existingExts.length + existExtCs + builtExts >= maxLimit) break;
      const res = room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
      if (res === OK) {
        builtExts++;
      }
    }
    return builtExts;
  }

  private buildPlannedStorage(room: Room, planStorage?: { x: number; y: number }): number {
    if (!planStorage) return 0;

    console.log(`${this.prefix} try build storage at ${planStorage.x ?? "null"},${planStorage.y}`);
    const csAt = room.lookForAt(LOOK_CONSTRUCTION_SITES, planStorage.x, planStorage.y);
    const posAt = room.lookForAt(LOOK_STRUCTURES, planStorage.x, planStorage.y);

    if (csAt.length && csAt[0].structureType === STRUCTURE_STORAGE) {
      console.log(`${this.prefix} storage construction site already exists`);
      return 0;
    } else if (posAt.length && posAt[0].structureType === STRUCTURE_STORAGE) {
      console.log(`${this.prefix} storage already exists`);
      return 0;
    } else {
      const existStorage = room.storage;
      if (existStorage) {
        console.log("destroy existing storage");
        // existStorage.destroy();
      }
      if (posAt.length) {
        const s = posAt[0];
        console.log("destroy existing structure ", s.structureType);
        s.destroy();
      }
      const res = room.createConstructionSite(planStorage.x, planStorage.y, STRUCTURE_STORAGE);
      return res === OK ? 1 : 0;
    }
  }

  private buildRoads() {}
  private buildExtensions() {}
  private buildStorage() {}

  public constructionPer20Ticks(roomName: string) {
    if (this.seePlan) {
      //@ts-ignore
      visualizePlan(roomName);
    }

    if (Game.time % 20 === 0) {
      this.construction(roomName);
    }
  }

  public toggleSeePlan(x?: boolean) {
    this.seePlan = x === undefined ? !this.seePlan : x;
  }

  public run() {
    const roomName = "W8N7";
    this.constructionPer20Ticks(roomName);
  }
}

// Usage example
export const planner = new AutoPlannerV201();
planner.run();
// @ts-ignore
global.see_plan = (x?: boolean) => planner.toggleSeePlan(x);
