import { Helper } from "utils";
import { BaseRole } from "./base";
import { dc } from "types";
// import { role_stat } from "./const";

// state: idle -> harvest
export class RoleHarvestSource extends BaseRole {
  public idle_next = dc.stat_role.harvest;
  constructor(creep: Creep) {
    super("harvest", creep);
  }

  public update_tick(creep: Creep): void {
    super.update_tick(creep);
    if (this.state === dc.stat_role.harvest) {
      this.harvest();
    }
  }

  public find_target(): Source | null {
    let target = Game.getObjectById(this.memory.target as Id<Source>);
    this.creep.pos.findClosestByRange;
    if (!target) {
      const mem_sources = this.creep.room.memory.sources;
      const sources = this.creep.room.get_sources();
      target = Helper.getClosestByPos(this.creep.pos, sources, {
        filter: s => !mem_sources[s.id]?.harvester,
      });
    }
    return target;
  }
  public harvest(): dc.code_ret {
    let res: any;
    const target = this.find_target();
    if (!target) {
      this.creep.say("no source");
      return dc.code_ret.err_no_target;
    }
    if (this.creep.pos.isNearTo(target.pos)) {
      res = this.creep.harvest(target);
    } else {
      this.creep.moveTo(target);
    }
    return dc.code_ret.ok;
  }
}
