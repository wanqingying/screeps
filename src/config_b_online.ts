//========0====1====2====3====4=====5=====6====7======8
// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]

export const cfg_online = {
    E18S5: {
        creep_cfg_num: {
            [w_role_name.starter]: 0,
            [w_role_name.carrier]: 4,
            [w_role_name.scout]: 0,
            [w_role_name.builder]: 0,
            [w_role_name.harvester]: 2,
            [w_role_name.upgrader]: 2,
            [w_role_name.repair]: 1,
            [w_role_name.remote_carry]: 0,
            [w_role_name.remote_reserve]: 0,
            [w_role_name.remote_harvester]: 0,
        },
        reserve: {
            E18S4: [{ id: '5bbcadfd9099fc012e638421', container_id: '' }],
            E19S5: [{ id: '5bbcae0b9099fc012e6385b1', container_id: '' }],
        },
        remote_container: ['5ee82325c4fce716b1ac5389'],
    },
    sim: {
        creep_cfg_num: {
            [w_role_name.starter]: 1,
            [w_role_name.carrier]: 3,
            [w_role_name.scout]: 0,
            [w_role_name.builder]: 0,
            [w_role_name.harvester]: 2,
            [w_role_name.upgrader]: 2,
            [w_role_name.claim]: 0,
            [w_role_name.repair]: 0,
        },
        reserve_rooms: [],
    },
};
