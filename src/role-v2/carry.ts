import { Helper } from "utils";
import { BaseRole } from "./base";
import { dc } from "types";

// state: idle -> restore->drop
export class RoleCarry extends BaseRole {
  public idle_next = dc.stat_role.restore;
  constructor(creep: Creep) {
    super(creep, dc.role.carry);
  }
  private busy: boolean = false;

  public update_tick(creep: Creep): void {
    super.update_tick(creep);
    this.busy = false;

    let ci = 0;
    while (ci++ < 2 && !this.busy) {
      this.work();
    }
  }
  public work() {
    if (this.state === dc.stat_role.restore) {
      this.restore();
    }
    if (this.state === dc.stat_role.restoreing) {
      this.restoreing();
    }
    if (this.state === dc.stat_role.drop) {
      this.drop();
    }
    if (this.state === dc.stat_role.dropping) {
      this.dropping();
    }
  }

  public find_target(): Source | null {
    let target = Game.getObjectById(this.memory.target as Id<Source>);
    if (!target) {
      const sources = this.creep.room.get_sources();
      target = Helper.getClosestByPos(this.creep.pos, sources, {
        // filter: s => !mem_sources[s.id]?.harvester,
      });
    }
    return target;
  }
  public restore(): dc.code_ret {
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
  public restoreing(): dc.code_ret {
    return dc.code_ret.ok;
  }
  public drop(): dc.code_ret {
    return dc.code_ret.ok;
  }
  public dropping(): dc.code_ret {
    return dc.code_ret.ok;
  }
}
