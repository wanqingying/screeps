//=============1==2====3====4=====5=====6
// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]
export const cfg_online = {
    W22S15: {
        creep_cfg_num: {
            [w_role_name.starter]: 0,
            [w_role_name.carrier]: 3,
            [w_role_name.scout]: 0,
            [w_role_name.builder]: 1,
            [w_role_name.harvester]: 2,
            [w_role_name.upgrader]: 3,
            [w_role_name.repair]: 1,
        },
        creep_cfg_body: {
            [w_role_name.carrier]: { [MOVE]: 4, [CARRY]: 8 },
            [w_role_name.starter]: { [MOVE]: 2, [CARRY]: 1, [WORK]: 2 },
            [w_role_name.harvester]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 0 },
            [w_role_name.builder]: { [MOVE]: 4, [WORK]: 2, [CARRY]: 6 },
            [w_role_name.upgrader]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 2 },
            [w_role_name.scout]: { [MOVE]: 1, [CARRY]: 0 },
            [w_role_name.claim]: { [MOVE]: 2, [CLAIM]: 2 },
            [w_role_name.repair]: {[MOVE]: 4, [WORK]: 3, [CARRY]: 6 },
        },
        reserve_rooms: [],
        freePlace: {
            [w_role_name.carrier]: { x: 23, y: 40 },
            [w_role_name.builder]: { x: 24, y: 27 },
        },
    },
};
