class BaseTaskTarget<H extends AnyPos> {
    constructor(target: H) {
        const pos = target.pos;
        this.id = target.id;
        this._pos = { x: pos.x, y: pos.y, roomName: pos.roomName };
        this._ref = target;
    }
    private up_tk = Game.time;
    private _ref: H | null;
    get ref() {
        if (Game.time !== this.up_tk) {
            this.up_tk = Game.time;
            this._ref = Game.getObjectById(this.id);
        }
        return this._ref;
    }
    readonly id: string;
    readonly _pos: { x: number; y: number; roomName: string };
    get pos(): RoomPosition {
        const { x, y, roomName } = this._pos;
        return new RoomPosition(x, y, roomName);
    }
}

declare interface TaskWorkSettings {
    workRange?: number;
    onShot?:boolean
}

declare interface AnyPos {
    pos:RoomPosition
    id:string
}

export abstract class BaseTask<T extends AnyPos, U> {
    target: BaseTaskTarget<T>;
    readonly taskType: string;
    _creep_name: string;
    settings: TaskWorkSettings;
    protected constructor(taskType: string, target: T, settings?) {
        this.target = new BaseTaskTarget<T>(target);
        this.taskType = taskType;
        this.settings = Object.assign({ workRange: 1 },settings);
    }

    abstract work(): number;
    set creep(creep:Creep){
        this._creep_name=creep.name;
    }
    get creep(){
        return Game.creeps[this._creep_name]
    }

    private reach = () => {
        return this.creep.pos.inRangeToPos(this.target.pos, this.settings.workRange);
    };
    private goToTarget = () => {
        this.creep.gotoPos(this.target.pos,this.settings.workRange)
    };

    abstract isTaskReady():boolean
    abstract isTargetReady():boolean
    abstract shouldFinishTask():boolean

    finish = () => {};

    run = () => {
        if (this.reach()) {
            const ret = this.work();
            if (ret === OK&&this.settings.onShot) {
                this.finish();
            }
            if (ret===OK&&this.shouldFinishTask()){
                this.finish();
            }
        } else {
            this.goToTarget();
        }
    };
}

console.log(BaseTask);
