import {
    is_empty_tate,
    is_full_tate,
    isEmpty,
    isFull,
    isNotEmpty,
    isNotFull,
    run_creep,
} from './lib_base';
import { moveToTarget } from './lib_creep';

export class BaseClaim {
    private roomsLink: any;
    private resType = RESOURCE_ENERGY;
    constructor() {}

    public static start = () => {
        run_creep(w_role_name.claim_start, creep => {
            let target = creep.memory.target_room;
            if (!target) {
                return;
            }
            if (creep.room.name !== target) {
                return;
            }
            let source: Source = creep.room.find(FIND_SOURCES).pop();

            if (isEmpty(creep)) {
                creep.memory.process = 'get';
            }
            if (isFull(creep)) {
                creep.memory.process = 'work';
            }

            if (creep.memory.process === 'get') {
                let far = moveToTarget(creep, source as any);
                creep.harvest(source);
            }
            if (creep.memory.process === 'work') {
                // TransportDriver.give_resource(creep)
                const cts = creep.room.find(FIND_MY_CONSTRUCTION_SITES).pop();
                if (cts) {
                    moveToTarget(creep, cts as any);
                    creep.build(cts);
                }
            }
        });
    };
}
