//=============1==2====3====4=====5=====6
// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]
const w = global.w_role_name;
export const cfg_local = {
    W1N7: {
        creep_cfg_num: {
            [w_role_name.starter]: 0,
            [w_role_name.carrier]: 3,
            [w_role_name.scout]: 0,
            [w_role_name.builder]: 0,
            [w_role_name.harvester]: 2,
            [w_role_name.upgrader]: 1,
            [w_role_name.repair]: 1,
            [w_role_name.attack]: 0,
        },
        reserve_rooms: [],
        claims: {
            name: 'W1N8',
            creep: [
                // [w_role_name.harvester, 1],
                // [w_role_name.builder, 1],
                // [w_role_name.upgrader, 1],
            ],
        },
        // claim: 'W2N7',
        ext_creep: [
            { role: w_role_name.harvester, num: 3, target_room: 'W2N7' },
            { role: 'carrier', num: 1, target_room: 'W2N7' },
            { role: w_role_name.builder, num: 3, target_room: 'W2N7' },
        ],
    },
    W1N8: {
        creep_cfg_num: {
            [w.starter]: 0,
            [w.carrier]: 2,
            [w.scout]: 0,
            [w.builder]: 2,
            [w.harvester]: 2,
            [w.upgrader]: 2,
            [w.repair]: 1,
            [w.attack]: 1,
        },
        claims: {
            name: 'W1N8',
            creep: [
                [w.harvester, 1],
                [w.builder, 1],
                // [w_role_name.upgrader, 1],
            ],
        },
        // claim: 'W2N7',
        ext_creep: [
            { role: w.harvester, num: 3, target_room: 'W2N7' },
            { role: w.carrier, num: 1, target_room: 'W2N7' },
            { role: w_role_name.builder, num: 3, target_room: 'W2N7' },
        ],
    },
    W2N7: {
        creep_cfg_num: {
            [w_role_name.starter]: 0,
            [w_role_name.carrier]: 3,
            [w_role_name.scout]: 0,
            [w_role_name.builder]: 1,
            [w_role_name.harvester]: 2,
            [w_role_name.upgrader]: 1,
            [w_role_name.repair]: 1,
        },
        reserve: [
            // { name: 'W3N7', sources: [{ id: 'eff307740862fd8' }, { id: 'eee50774086309c' }] },
        ],
        claim: 'W2N7',
    },
};
