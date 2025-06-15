interface DcConfig {
  rooms: {
    [roomName: string]: {
      pos_idle?: {
        pos: [number, number];
      };
      min_source_ctn: number;
      build_wall?: boolean;
    };
  };
}
export const dc_config: DcConfig = {
  rooms: {
    W51S34: {
      pos_idle: { pos: [13, 23] },
      min_source_ctn: 1000,
      build_wall: false
    }
  }
};
