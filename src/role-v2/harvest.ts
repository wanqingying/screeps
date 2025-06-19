import { Helper } from "utils";
import { BaseRole } from "./base";
import { dc } from "types";

// state: idle -> harvest
export class RoleHarvestSource extends BaseRole {
  public idle_next = dc.stat_role.harvest;
  constructor(creep: Creep) {
    super(creep, dc.role.harvester);
  }

  public update_tick(creep: Creep): void {
    super.update_tick(creep);
    if (this.state === dc.stat_role.harvest) {
      this.harvest();
    }
    if (Game.time % 9 === 0) {
      this.check_source_duplicate();
    }
  }
  public check_source_duplicate() {
    // check if 2 source have the same harvester
    const target = this.find_target();
    if (target) {
      const sources = this.creep.room.get_sources();
      for (const s of sources) {
        const mem_id = this.creep.room.memory.sources[s.id]?.harvester;
        if (mem_id === this.creep.id && s.id !== target.id) {
          // if the source is not the target, remove the harvester
          this.creep.room.memory.sources[s.id].harvester = undefined;
        }
      }
    }
  }

  public find_target(): Source | null {
    let target = Game.getObjectById(this.memory.target as Id<Source>);
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
    this.creep.memory.target = target.id;
    this.creep.room.memory.sources[target.id].harvester = this.creep.id;
    if (this.creep.pos.isNearTo(target.pos)) {
      res = this.creep.harvest(target);
    } else {
      this.creep.moveTo(target);
    }
    return dc.code_ret.ok;
  }
}
