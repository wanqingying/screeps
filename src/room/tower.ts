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

export function runTower(room: Room) {
  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: (s: Structure) => s.structureType === STRUCTURE_TOWER
  });

  for (const tower of towers) {
  }
}

function findToRepair(room: Room) {
  const reps = room.find(FIND_STRUCTURES, {
    filter: s =>
      s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART && s.hitsMax - s.hits > 1000
  });
}
