//=============1==2====3====4=====5=====6
// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]
export const cfg_local = {
    creep_cfg_num: {
        [w_role_name.starter]: 0,
        [w_role_name.carrier]: 2,
        [w_role_name.scout]: 0,
        [w_role_name.builder]: 1,
        [w_role_name.harvester]: 2,
        [w_role_name.upgrader]: 1,
    },
    creep_cfg_body: {
        [w_role_name.carrier]: { [MOVE]: 13, [CARRY]: 13 },
        [w_role_name.starter]: { [MOVE]: 2, [CARRY]: 1, [WORK]: 2 },
        [w_role_name.harvester]: { [MOVE]: 3, [WORK]: 6, [CARRY]: 0 },
        [w_role_name.builder]: { [MOVE]: 12, [WORK]: 6, [CARRY]: 12 },
        [w_role_name.upgrader]: { [MOVE]: 2, [WORK]: 11, [CARRY]: 2 },
        [w_role_name.scout]: { [MOVE]: 1, [CARRY]: 0 },
    },
    reserve_rooms: [],
    freePlace : {
        [w_role_name.carrier]: { x: 23, y: 40 },
        [w_role_name.builder]: { x: 24, y: 27 },
    }
};
