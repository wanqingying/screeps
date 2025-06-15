import { Role, dc } from "types";

export const dc_config: dc.GameConfig = {
  rooms: {
    W51S34: {
      pos_idle: { pos: [13, 23] },
      min_source_ctn: 1000,
      build_wall: false,
      roles_limit: {
        [Role.starter]: 1,
        [Role.worker]: 0,
        [Role.carrier]: 4,
        [Role.upgrader]: 5,
        [Role.builder]: 4,
        [Role.harvester]: 2,
        [Role.ruin_cary]: 0,
        [Role.repairer]: 1
      }
    },
    W8N7: {
      pos_idle: { pos: [13, 23] },
      min_source_ctn: 150,
      build_wall: false,
      roles_limit: {
        [Role.starter]: 1,
        [Role.worker]: 0,
        [Role.carrier]: 2,
        [Role.upgrader]: 1,
        [Role.builder]: 2,
        [Role.harvester]: 2,
        [Role.ruin_cary]: 0,
        [Role.repairer]: 0
      }
    }
  }
};
