export class RootObj {
  protected clsname = "[root]";
  //   protected log = console.log;

  public log(this: object, ...args: any[]) {
    const clsname = this.constructor.name;
    console.log(`[${Game.time}|${clsname}]:`, ...args);
  }
}
