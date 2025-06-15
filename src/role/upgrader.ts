// var roleUpgrader = {

//     /** @param {Creep} creep **/
//     run: function(creep) {
//         if(creep.store[RESOURCE_ENERGY] == 0) {
//             var sources = creep.room.find(FIND_SOURCES);
//             if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
//                 creep.moveTo(sources[0]);
//             }
//         }
//         else {
//             if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
//                 creep.moveTo(creep.room.controller);
//             }
//         }
//     }
// };

// module.exports = roleUpgrader;

export enum state_updater {
  idle = "idle",
  upgrading = "upgrading",
  dropping = "dropping",
  restore = "restore"
}

export function work_upgrader(creep: Creep) {
  const room = creep.room;
  let state = creep.memory.state || state_updater.idle;
  if (state === state_updater.idle) {
    state = state_updater.restore;
  }
  if (state === state_updater.restore) {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (room.memory.controller?.container) {
      const target = Game.getObjectById(room.memory.controller?.container);
      if (target && target.store[RESOURCE_ENERGY] > 0) {
        if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target);
        }
      } else {
        creep.memory.target = "";
        creep.moveTo(spawn, {});
      }
    }
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.state = state_updater.upgrading;
    }
  }
  if (state === state_updater.upgrading) {
    const controller = room.controller;
    if (controller) {
      if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(controller);
      } else {
        if (!creep.memory.near) {
          creep.moveTo(controller);
          creep.memory.near = 1;
        }
      }
    }
    if (creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.state = state_updater.restore;
      delete creep.memory.near;
    }
  }
}
