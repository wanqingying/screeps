import { BaseTask } from './task_base';


export class TaskBuild extends BaseTask<ConstructionSite,any>{
    constructor(taskType,target) {
        super(taskType,target);
    }

    work(): number {
        return this.creep.build(this.target.ref)
    }
}
