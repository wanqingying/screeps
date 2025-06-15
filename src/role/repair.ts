import { restoreNearbyEnergy } from "./share";

enum state_repair {
  idle = "idle",
  //   building = "building",
  restore = "restore",
  repair = "repair"
}

function get_resource(creep: Creep) {
  let res = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
    filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 30
  });

  if (res) {
    if (creep.pickup(res) === ERR_NOT_IN_RANGE) {
      creep.moveTo(res);
    }
    return;
  }

  const cont = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: (s: Structure) =>
      s.structureType === STRUCTURE_CONTAINER && (s as StructureContainer).store[RESOURCE_ENERGY] > 30
  });
  if (cont) {
    if (creep.withdraw(cont, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(cont);
    }
  }

  const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
  if (spawn) {
    if (creep.withdraw(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(spawn);
    }
  } else {
    console.log(`No spawn found for creep ${creep.name}`);
  }
}

export function work_repair(creep: Creep) {
  if (creep.memory.state === state_repair.idle) {
    creep.memory.state = state_repair.restore;
  }

  if (creep.memory.state === state_repair.restore) {
    // const is_full = getNearbyEnergy(creep);
    if (restoreNearbyEnergy(creep)) {
      creep.memory.state = state_repair.repair;
    }
  } else if (creep.memory.state === state_repair.repair) {
    const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES,{
		filter: (s: Structure) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
	});
    if (target) {
    //   if (creep.build(target) === ERR_NOT_IN_RANGE) {
    //     creep.moveTo(target);
    //   }
    }
    if (creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.state = state_repair.restore;
    }
  }
}
