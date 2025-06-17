export class BaseWorkRole {
  public readonly role_name: string;
  public readonly creep: Creep;
  constructor(role_name: string, creep: Creep) {
    this.role_name = role_name;
    this.creep = creep;
  }

  public moveTo(pos: RoomPosition) {
	


  }
}
