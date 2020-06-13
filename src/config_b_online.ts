//=============1==2====3====4=====5=====6

// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]
export const cfg_online = {
    E18S5: {
        creep_cfg_num: {
            [w_role_name.starter]: 0,
            [w_role_name.carrier]: 2,
            [w_role_name.scout]: 0,
            [w_role_name.builder]: 3,
            [w_role_name.harvester]: 2,
            [w_role_name.upgrader]: 2,
            [w_role_name.repair]: 0,
        },
        creep_cfg_body: {
            [w_role_name.carrier]: { [MOVE]: 2, [CARRY]: 2 },
            [w_role_name.starter]: { [MOVE]: 2, [CARRY]: 1, [WORK]: 2 },
            [w_role_name.harvester]: { [MOVE]: 1, [WORK]: 2, [CARRY]: 1 },
            [w_role_name.builder]: { [MOVE]: 2, [WORK]: 1, [CARRY]: 2 },
            [w_role_name.upgrader]: { [MOVE]: 1, [WORK]: 2, [CARRY]: 1 },
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

console.log(44);

