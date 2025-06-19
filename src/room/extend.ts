import { CacheTick, Log } from "utils";

export class RoomExtend {
  public room: Room;
  constructor(room: Room) {
    this.room = room;
  }
  // set every tick or every time get room
  public setRoom(r: Room) {
    this.room = r;
  }

  @CacheTick(3)
  @Log(1, "TEST")
  getRdGameTime(v: string = ""): string {
    return Game.time + Math.floor(Math.random() * 1000) + v;
  }

  @CacheTick(100)
  public get_sources(): Source[] {
    return this.room.find(FIND_SOURCES);
  }

//   public g
}
