export function renew(creep: Creep) {
  const t = Game.getObjectById(creep.memory.target as Id<StructureSpawn>);
  if (t && t instanceof StructureSpawn) {
    if (Game.time % 4 === 0) {
      creep.say("🔄");
    }
    if (creep.pos.isNearTo(t.pos)) {
      t.renewCreep(creep);
      if (creep.ticksToLive && creep.ticksToLive > 1490) {
        creep.memory.state = "idle";
        creep.memory.target = "";
        delete creep.room.cache.renew;
      }
    } else {
      creep.moveTo(t);
    }
  } else {
    // creep.memory.target = "";
    const sp = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
    if (sp) {
      creep.memory.target = sp.id;
      creep.memory.state = "renew";
      creep.room.cache.renew = creep.name;
      creep.moveTo(sp);
    }
  }
}
