import { Role } from "types";

export function restoreNearbyEnergy(creep: Creep) {
  const target = getNearByPos(creep);
  if (target) {
    if (target instanceof Resource) {
      if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      if (target.amount === 0) {
        creep.memory.target = "";
      }
    } else if (target instanceof Structure || target instanceof Ruin) {
      if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      if ((target as StructureContainer).store?.[RESOURCE_ENERGY] === 0) {
        creep.memory.target = "";
      }
    }
  }
  const isFull = creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
  if (isFull) {
    creep.memory.target = "";
  }
  return isFull;
}

type ResType = StructureContainer | Ruin | Resource;

function getNearByPos(creep: Creep): any {
  if (creep.memory.target) {
    const target = Game.getObjectById<any>(creep.memory.target);
    if (target) {
      return target;
    } else {
      creep.memory.target = "";
    }
  }

  const ruin_x = creep.pos.findClosestByPath(FIND_RUINS, {
    filter: r => r.store[RESOURCE_ENERGY] > 0,
  });

  //   if (ruin_x) {
  //     creep.memory.target = ruin_x.id;
  //     return ruin_x;
  //   }

  const dropped = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
    filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 20,
  });
  const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: (s: Structure) => {
      if (s.id === creep.room.memory.controller?.container) {
        return false;
      }
      return s.structureType === STRUCTURE_CONTAINER && (s as StructureContainer).store[RESOURCE_ENERGY] > 20;
    },
  });
  const spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
    filter: (s: StructureSpawn) => s.store[RESOURCE_ENERGY] > 20,
  });
  const storage = creep.room.storage;

  const poss = [
    {
      target: dropped,
      mx: 1,
      amount: dropped?.amount || 0,
      pos: dropped?.pos,
    },
    {
      target: ruin_x,
      mx: 1,
      amount: ruin_x?.store?.[RESOURCE_ENERGY] || 0,
      pos: ruin_x?.pos,
    },
    {
      target: storage,
      mx: 3,
      amount: storage?.store?.[RESOURCE_ENERGY] || 0,
      pos: storage?.pos,
    },
    {
      target: container,
      mx: 1,
      amount: (container as StructureContainer)?.store?.[RESOURCE_ENERGY] || 0,
      pos: container?.pos,
    },
  ]
    .map(t => {
      if (!t?.pos) return null;
      const range = creep.pos.getRangeTo(t.pos);
      const max_amount = creep.store.getFreeCapacity(RESOURCE_ENERGY);
      const w_amount = Math.min(t.amount, max_amount) / 3;

      return {
        target: t.target,
        pos: t.pos,
        weigth: (t.mx * (w_amount + 1)) / (range + 1),
      };
    })
    .filter(t => t && t.target)
    .sort((a: any, b: any) => b.weigth - a.weigth);

  const t = poss[0]?.target;
  creep.memory.target = t?.id || "";
  return t;
}

type DropTargetType = StructureSpawn | StructureExtension | StructureStorage | StructureContainer | StructureTower;
export function getDropTarget(creep: Creep): DropTargetType | null {
  let target = Game.getObjectById<DropTargetType>(creep.memory.target as Id<DropTargetType>);
  if (target) {
    return target;
  } else {
    creep.memory.target = "";
  }

  const spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
    filter: s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  });
  if (spawn) {
    return spawn;
  }
  const ext = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_EXTENSION && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  }) as StructureExtension | null;
  if (ext) {
    return ext;
  }
  const tower = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 100,
  }) as StructureTower | null;
  if (tower) {
    return tower;
  }

  const cont = Game.getObjectById(creep.room.memory.controller?.container as Id<StructureContainer>);
  if (cont && cont.store.getFreeCapacity(RESOURCE_ENERGY) >= creep.store[RESOURCE_ENERGY]) {
    return cont;
  }

  const storage = creep.room.storage;
  if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    return storage;
  }
  const r = creep.room;
  const exp_ids = [...Object.values(r.memory.sources).map(s => s.container)].filter(id => id);

  const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: s =>
      s.structureType === STRUCTURE_CONTAINER &&
      !exp_ids.includes(s.id) &&
      s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  }) as StructureContainer | null;

  return container || null;
}

export enum TransOver {
  empty = 1,
  not_empty = 0,
  no_target = -1,
}
export function transfer(creep: Creep) {
  const target = getDropTarget(creep);
  if (target) {
    creep.memory.target = target.id;
    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, {
        reusePath: 5,
        visualizePathStyle: {
          fill: "transparent",
          stroke: "#fff",
          lineStyle: "dashed",
          strokeWidth: 0.15,
          opacity: 0.1,
        },
      });
    }
    if (target.store && target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.target = "";
    }
    const empty = creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0;
    return empty ? TransOver.empty : TransOver.not_empty;
  } else {
    return TransOver.no_target;
  }
}
