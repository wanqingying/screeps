//=============1==2====3====4=====5=====6
// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]
export const cfg_local = {
    W1N7: {
        creep_cfg_num: {
            [w_role_name.starter]: 0,
            [w_role_name.carrier]: 3,
            [w_role_name.scout]: 0,
            [w_role_name.builder]: 1,
            [w_role_name.harvester]: 2,
            [w_role_name.upgrader]: 1,
            [w_role_name.repair]: 1,
        },
        creep_cfg_body: {
            [w_role_name.carrier]: { [MOVE]: 5, [CARRY]: 15 },
            [w_role_name.starter]: { [MOVE]: 2, [CARRY]: 1, [WORK]: 2 },
            [w_role_name.harvester]: { [MOVE]: 2, [WORK]: 7, [CARRY]: 0 },
            [w_role_name.builder]: { [MOVE]: 10, [WORK]: 4, [CARRY]: 12 },
            [w_role_name.upgrader]: { [MOVE]: 2, [WORK]: 10, [CARRY]: 2 },
            [w_role_name.scout]: { [MOVE]: 1, [CARRY]: 0 },
            [w_role_name.claim]: { [MOVE]: 2, [CLAIM]: 2 },
            [w_role_name.repair]: {[MOVE]: 6, [WORK]: 4, [CARRY]: 10 },
        },
        reserve_rooms: [],
        freePlace: {
            [w_role_name.carrier]: { x: 23, y: 40 },
            [w_role_name.builder]: { x: 24, y: 27 },
        },
        claims: {
            name: 'W2N7',
            creep: [
                [w_role_name.harvester, 1],
                [w_role_name.builder, 1],
                [w_role_name.upgrader, 1],
            ],
        },
        // claim: 'W2N7',
        ext_creep: [
            { role: w_role_name.harvester, num: 3, target_room: 'W2N7' },
            { role: 'carrier', num: 1, target_room: 'W2N7' },
            { role: w_role_name.builder, num: 3, target_room: 'W2N7' },
        ],
    },
    W2N7: {
        creep_cfg_num: {
            [w_role_name.starter]: 0,
            [w_role_name.carrier]: 2,
            [w_role_name.scout]: 0,
            [w_role_name.builder]: 1,
            [w_role_name.harvester]: 2,
            [w_role_name.upgrader]: 2,
            [w_role_name.repair]: 1,
        },
        creep_cfg_body: {
            [w_role_name.carrier]: { [MOVE]: 4, [CARRY]: 6, },
            [w_role_name.starter]: { [MOVE]: 2, [CARRY]: 1, [WORK]: 2 },
            [w_role_name.harvester]: { [MOVE]: 1, [WORK]: 4, [CARRY]: 0 },
            [w_role_name.builder]: { [MOVE]: 2, [WORK]: 1, [CARRY]: 2 },
            [w_role_name.upgrader]: { [MOVE]: 2, [WORK]: 6, [CARRY]: 2 },
            [w_role_name.scout]: { [MOVE]: 1, [CARRY]: 0 },
            [w_role_name.claim]: { [MOVE]: 2, [CLAIM]: 2 },
            [w_role_name.repair]: {[MOVE]: 2, [WORK]: 2, [CARRY]: 3 },
        },
        reserve_rooms: [],
        freePlace: {
            [w_role_name.carrier]: { x: 23, y: 40 },
            [w_role_name.builder]: { x: 24, y: 27 },
        },
        claim: 'W2N7',
    },
};
