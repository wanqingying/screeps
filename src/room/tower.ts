//   var tower = Game.getObjectById('TOWER_ID');
//     if(tower) {
//         var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
//             filter: (structure) => structure.hits < structure.hitsMax
//         });
//         if(closestDamagedStructure) {
//             tower.repair(closestDamagedStructure);
//         }

//         var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
//         if(closestHostile) {
//             tower.attack(closestHostile);
//         }
//     }

export function runTowerAtk(room: Room) {
  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: (s: Structure) => s.structureType === STRUCTURE_TOWER
  }) as StructureTower[];

  for (const tower of towers) {
    let obj: any;
    if (Game.time % 4 === 0) {
      const to_atk = findToAttack(tower);
      if (to_atk) {
        tower.memory.target = to_atk.id;
        obj = to_atk;
      }
    }
    attack(tower, obj);
  }
}
export function attack(tower: StructureTower, target?: Creep) {
  const to_atk = target || Game.getObjectById(tower.memory.target as Id<Creep>);

  if (to_atk) {
    tower.memory.target = to_atk.id;
    tower.attack(to_atk);
  }
  if (!to_atk || to_atk.hits <= 0) {
    tower.memory.target = "";
  }
}

function findToRepair(room: Room) {
  const reps = room.find(FIND_STRUCTURES, {
    filter: s =>
      s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART && s.hitsMax - s.hits > 1000
  });
}

function findToAttack(tower: StructureTower) {
  const room = tower.room;
  const mem = Game.getObjectById(tower.memory.target as Id<Creep>);
  if (mem) {
    return mem;
  } else {
    tower.memory.target = "";
  }

  //   const hos_heal = room.find(FIND_HOSTILE_CREEPS, {
  //     filter: c => c.getActiveBodyparts(HEAL) > 0
  //   });
  //   if (hos_heal.length) {
  //     return hos_heal.sort((a, b) => b.hits - a.hits)[0];
  //   }

  //   const hos_atk = room.find(FIND_HOSTILE_CREEPS, {
  //     filter: c => c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0
  //   });
  //   if (hos_atk.length) {
  //     return hos_atk.sort((a, b) => b.hits - a.hits)[0];
  //   }

  const hos_safe = room.find(FIND_HOSTILE_CREEPS);
  if (!hos_safe.length) {
    return null;
  }

  const randomCreep = room.find(FIND_MY_CREEPS);
  if (randomCreep.length) {
    randomCreep[0].say(`Warning!`, true);
  }
  if (hos_safe.length) {
    return hos_safe.sort((a, b) => b.hits - a.hits)[0];
  }

  return null;
}
