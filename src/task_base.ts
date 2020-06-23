

class BaseTaskTarget<H extends AnyStructure> {
    constructor(target:H) {
        const pos=target.pos;
        this.id=target.id;
        this._pos={x:pos.x,y:pos.y,roomName:pos.roomName}
        this._ref=target
    }
    private up_tk=Game.time;
    private _ref:H|null
     get ref(){
        if (Game.time!==this.up_tk){
            this.up_tk=Game.time
            this._ref=Game.getObjectById(this.id);
        }
        return this._ref
    }
     readonly  id:string
     readonly _pos:{x:number,y:number,roomName:string}
     get pos():RoomPosition{
        const {x,y,roomName}=this._pos;
        return new RoomPosition(x,y,roomName)
    }
}

declare interface TaskWorkSettings {
    workRange?:number
}

abstract class BaseTask<T extends AnyStructure , U> {
     target:BaseTaskTarget<T>
     readonly taskType:string
     creep:Creep
     settings:TaskWorkSettings
    protected constructor(taskType:string, target:T, settings) {
        this.target=new BaseTaskTarget<T>(target)
        this.taskType=taskType
        this.settings={workRange:1}
    }


    abstract work():number

    private reach = () => {
        return this.creep.pos.inRangeToPos(this.target.pos,this.settings.workRange)
    };
    private goToTarget = () => {
        this.creep.moveTo()
    };

     finish = () => {

    };

     run = () => {
         if (this.reach()){
            const ret=this.work()
             if (ret===OK){
                 this.finish();
             }
         }else{
             this.goToTarget();
         }
    };
}

console.log(BaseTask);