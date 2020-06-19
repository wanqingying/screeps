
import {  run_creep, run_my_room } from './lib_base';
export class HarvestAtMyRoom {
    private array2:PosDescMine<Source|Mineral>[]=[]
    constructor() {
        run_my_room(room => {
            const arr= G_BaseRoom.findHarvestTargetsInRoom(room)
            this.array2=this.array2.concat(arr);
        });
    }
    private updateState2 = () => {
        if (this.update_tick === Game.time) {
            return;
        }
        this.update_tick = Game.time;
        run_creep(w_role_name.harvester, creep => {
            const t_id = creep.memory.task_id;
            if (!t_id) {
                return;
            }
            const task = this.array2.find(t=>t.id===creep.memory.task_id);
            if (task) {
                task.creep_id = creep.id;
                task.update_tick = Game.time;
            }
        });
        this.array2.forEach(t => {
            if (t.update_tick !== Game.time) {
                t.creep_id = '';
            }
        });
    };
    private trySpawnWorker = () => {
        this.updateState2()
        this.array2.forEach(t=>{
            if (!t.extra){
                const room=Game.rooms[t.roomName];
                G_SpawnAuto.spawnCreep(room,w_role_name.harvester,{task_id:t.id})
            }
        })
    };
    private run_harvest = (creep: Creep) => {
        let task2=this.getTask2(creep)
        let free=creep.store.getFreeCapacity()

        if (!task2){
            creep.say('no_task')
            return;
        }
        if (free<16){
            if (task2.link){
                let code = creep.transfer(task2.link.target, RESOURCE_ENERGY);
                if (code === ERR_NOT_IN_RANGE) {
                    creep.moveTo(task2.link.target);
                    return;
                }
            }else{
                creep.drop(task2.resType)
            }
        }
        let code=creep.harvest(task2.target);
        if (code===ERR_NOT_IN_RANGE){
            creep.moveTo(task2.target)
        }
    };
    private getTask2 = (creep:Creep) => {
        let task= this.array2.find(t=>t.id===creep.memory.task_id);
        if (task){
            return task
        }
        const newTask=this.array2.find(t=>!t.creep_id&&t.roomName===creep.room.name);
        if (newTask){
            newTask.creep_id=creep.id;
            creep.memory.task_id=newTask.id;
        }
        return newTask
    };
    private update_tick = 0;
    private run = () => {
        this.updateState2();
        run_creep(w_role_name.harvester, this.run_harvest);
        this.trySpawnWorker();
    };
    private last_run_time = 0;
    public static cache_key = 'h_a_m_t';
    public static start = () => {
        let driver: HarvestAtMyRoom = w_cache.get(HarvestAtMyRoom.cache_key);
        if (!driver) {
            driver = new HarvestAtMyRoom();
            w_cache.set(HarvestAtMyRoom.cache_key, driver);
        }
        if (driver.last_run_time !== Game.time) {
            driver.last_run_time = Game.time;
            driver.run();
        }
        return driver;
    };
}

let driver: HarvestAtMyRoom = w_cache.get(HarvestAtMyRoom.cache_key);
if (!driver) {
    driver = new HarvestAtMyRoom();
    w_cache.set(HarvestAtMyRoom.cache_key, driver);
}
