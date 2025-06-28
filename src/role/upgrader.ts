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
  restore = "restore",
}

export function work_upgrader(creep: Creep) {
  const room = creep.room;
  if (creep.memory.state === state_updater.idle || !creep.memory.state) {
    creep.memory.state = state_updater.restore; // default state
  }
  // creep.say(creep.memory.state);
  if (creep.memory.state === state_updater.restore) {
    if (room.memory.controller?.container) {
      let target: any = Game.getObjectById(room.memory.controller?.container);
      if (!target || target?.store?.[RESOURCE_ENERGY]! < 40) {
        target =
          room.storage ||
          creep.pos.findClosestByPath(FIND_RUINS, {
            filter: r => r.store[RESOURCE_ENERGY] > 0,
          });
      }

      if (target && target.store[RESOURCE_ENERGY] > 0) {
        if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target);
        }
      } else {
        creep.memory.target = "";
        const config = room.memory.config;
        const [x, y] = config.pos_idle?.pos || [12, 25];
        creep.moveTo(x, y, { visualizePathStyle: { stroke: "#ffffff" } });
      }
    }
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.state = state_updater.upgrading;
    }
  }
  if (creep.memory.state === state_updater.upgrading) {
    const controller = room.controller;
    if (controller) {
      if (creep.pos.inRangeTo(controller, 3)) {
        creep.upgradeController(controller);
        if (creep.memory.tag < 2) {
          creep.moveTo(controller);
          creep.memory.tag = (creep.memory.tag || 0) + 1;
        }
      } else {
        creep.moveTo(controller);
        creep.memory.tag = 0; // reset tag to allow moving
      }
    } else {
      creep.say("no controller");
    }
    if (creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.state = state_updater.restore;
      delete creep.memory.near;
    }
  }
}
