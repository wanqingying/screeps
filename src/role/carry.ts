import { dc } from "types";
import { Helper } from "utils";

export class Carry {
  // public

  public static run_creep(creep: Creep) {
    const room = creep.room;

    if (!creep.memory.state || creep.memory.state === dc.stat_carry.idle) {
      creep.memory.state = dc.stat_carry.restore;
    }
    Carry.check(creep);

    if (creep.memory.state === dc.stat_carry.restore) {
      Carry.restore(creep);
    }
    if (creep.memory.state === dc.stat_carry.restoreing) {
      Carry.restoreing(creep);
    }
    if (creep.memory.state === dc.stat_carry.drop) {
      Carry.drop(creep);
    }
    if (creep.memory.state === dc.stat_carry.dropping) {
      Carry.droping(creep);
    }
    Carry.check(creep);
  }

  public static check(creep: Creep) {
    if (creep.store.getFreeCapacity() === 0 && creep.memory.state !== dc.stat_carry.dropping) {
      // full
      Carry.rm_target(creep);
      creep.memory.state = dc.stat_carry.drop;
    }
    if (creep.store.getUsedCapacity() === 0 && creep.memory.state !== dc.stat_carry.restoreing) {
      // empty
      Carry.rm_target(creep);
      creep.memory.state = dc.stat_carry.restore;
    }
  }

  public static set_target(creep: Creep, t: string) {
    if (Carry.carry_map.has(t)) {
      console.log("target already set for creep", creep.name, "to", t);
    }
    Carry.carry_map.set(t, creep.id);
    creep.memory.target = t;
  }
  public static rm_target(creep: Creep) {
    Carry.carry_map.delete(creep.memory.target);
    creep.memory.target = "";
  }

  public static get_trans_out(creep: Creep) {}
  public static isNeedStorage(creep: Creep) {
    const room = creep.room;
    const spawns = creep.room.find(FIND_MY_SPAWNS);
    const extensions = creep.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_EXTENSION,
    });
    const ctn = Game.getObjectById(room.memory.controller?.container as Id<StructureContainer>);
    const towers = room.find(FIND_MY_STRUCTURES, {
      filter: s =>
        s.structureType === STRUCTURE_TOWER &&
        s.store.getFreeCapacity(RESOURCE_ENERGY) > 50 &&
        !Carry.carry_map.has(s.id),
    }) as StructureTower[];

    const t0 = [...spawns, ...extensions]
      .filter(t => !Carry.carry_map.has(t.id))
      .some((s: StructureSpawn) => {
        return s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      });
    const t1 = ctn.store.getFreeCapacity(RESOURCE_ENERGY) > 1000;
    const t2 = towers.some(t => t.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
    return t0 || t1 || t2;
  }
  public static carry_map = new Map<string, any>();
  //   public static drop_map = new Map<string, any>();

  public static restore(creep: Creep) {
    const room = creep.room;
    const exts = room.extend.get_sources_ext();
    const free = creep.store.getFreeCapacity();
    const containers = exts
      .map(t => Game.getObjectById(t.container.id! as Id<StructureContainer>))
      .filter(c => {
        return c && !Carry.carry_map.has(c.id) && c.store[RESOURCE_ENERGY] > free;
      });
    const resources = room.find(FIND_DROPPED_RESOURCES, {
      filter: r => r.amount > 0 && !Carry.carry_map.has(r.id),
    });
    const ruins = room.find(FIND_RUINS, {
      filter: r => r.store.getUsedCapacity() > 0 && !Carry.carry_map.has(r.id),
    });
    const tombs = room.find(FIND_TOMBSTONES, {
      filter: t => t.store.getUsedCapacity() > 0 && !Carry.carry_map.has(t.id),
    });
    const targets = [...containers, ...resources, ...ruins, ...tombs];
    const clost = Helper.getClosestByPos(creep.pos, targets);
    if (clost) {
      creep.memory.state = dc.stat_carry.restoreing;
      Carry.set_target(creep, clost.id);
      return;
    }

    if (!room.storage || !Carry.isNeedStorage(creep)) {
      Carry.rm_target(creep);
      if (creep.store.getUsedCapacity() > 0) {
        creep.memory.state = dc.stat_carry.drop;
      } else {
        creep.memory.state = dc.stat_carry.idle;
      }
      return;
    } else {
      const storage = room.storage;
      creep.memory.target = storage.id;
      creep.memory.state = dc.stat_carry.restoreing;
      creep.memory.tag = "storage";
      //   Carry.restore_map.set(storage.id, creep.id);
    }
  }

  public static restoreing(creep: Creep): any {
    const target = Game.getObjectById<any>(creep.memory.target) as any;
    if (!target || !target.pos) {
      creep.memory.state = dc.stat_carry.restore;
      Carry.rm_target(creep);
      return;
    }
    if (!creep.pos.isNearTo(target)) {
      return creep.moveTo(target, {
        visualizePathStyle: { stroke: "#ff0000", opacity: 0.5, lineStyle: "dashed" },
      });
    }

    if (target instanceof StructureContainer) {
      creep.withdraw(target, RESOURCE_ENERGY);
    }
    if (target instanceof Resource) {
      creep.pickup(target);
    }
    if (target instanceof Ruin || target instanceof Tombstone) {
      const type = Helper.random_obj_key(target.store) as ResourceConstant;
      creep.withdraw(target, type);
    }
    if (target instanceof StructureStorage) {
      creep.withdraw(target, RESOURCE_ENERGY);
    }
    Carry.rm_target(creep);
    creep.memory.state = dc.stat_carry.restore;
  }
  public static drop(creep: Creep) {
    const room = creep.room;
    const free = creep.store.getFreeCapacity();
    const types = Array.from(Object.keys(creep.store)) as ResourceConstant[];
    const only_energy = types.length === 1 && types[0] === RESOURCE_ENERGY;
    if (only_energy) {
      const spawns = creep.room.find(FIND_MY_SPAWNS);
      const extensions = creep.room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_EXTENSION,
      });
      const t_0 = [...spawns, ...extensions].filter(
        (t: StructureSpawn) => !Carry.carry_map.has(t.id) && t.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
      );
      if (t_0.length > 0) {
        const clost = Helper.getClosestByPos(creep.pos, t_0);
        if (clost) {
          creep.memory.state = dc.stat_carry.dropping;
          Carry.set_target(creep, clost.id);
          return;
        }
      }
      const ctn = Game.getObjectById(room.memory.controller?.container as Id<StructureContainer>);
      if (ctn && ctn.store.getFreeCapacity(RESOURCE_ENERGY) > free && !Carry.carry_map.has(ctn.id)) {
        creep.memory.state = dc.stat_carry.dropping;
        Carry.set_target(creep, ctn.id);
        return;
      }
      const towers = room.find(FIND_MY_STRUCTURES, {
        filter: s =>
          s.structureType === STRUCTURE_TOWER &&
          s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
          !Carry.carry_map.has(s.id),
      });
      if (towers.length > 0) {
        const clost = Helper.getClosestByPos(creep.pos, towers);
        if (clost) {
          creep.memory.state = dc.stat_carry.dropping;
          Carry.set_target(creep, clost.id);
          return;
        }
      }
    }
    const storage = room.storage;
    if (storage && storage.store.getFreeCapacity() > 0 && creep.memory.tag !== "storage") {
      creep.memory.state = dc.stat_carry.dropping;
      creep.memory.target = room.storage.id;
      return;
    }
  }
  public static droping(creep: Creep): any {
    const target = Game.getObjectById<any>(creep.memory.target) as any;
    if (!target) {
      creep.memory.state = dc.stat_carry.drop;
      Carry.rm_target(creep);
      return;
    }

    if (!creep.pos.isNearTo(target)) {
      return creep.moveTo(target, {
        visualizePathStyle: { stroke: "#0000ff", opacity: 0.5, lineStyle: "dashed" },
      });
    }

    if (
      target instanceof StructureSpawn ||
      target instanceof StructureExtension ||
      target instanceof StructureContainer ||
      target instanceof StructureTower
    ) {
      creep.transfer(target, RESOURCE_ENERGY);
    }

    if (target instanceof StructureStorage) {
      const type = Helper.random_obj_key(creep.store) as ResourceConstant;
      creep.transfer(target, type);
    }

    Carry.rm_target(creep);
    creep.memory.state = dc.stat_carry.drop;
    creep.memory.tag = "";
  }
}
