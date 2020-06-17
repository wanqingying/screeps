//========0====1====2====3====4=====5=====6====7======8
// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]

export const cfg_online: { [k: string]: CfgRoom } = {
    E18S5: {
        creep_cfg_num: {
            [w_role_name.starter]: 0,
            [w_role_name.carrier]: 2,
            [w_role_name.scout]: 0,
            [w_role_name.builder]: 0,
            [w_role_name.harvester]: 2,
            [w_role_name.upgrader]: 2,
            [w_role_name.repair]: 1,
            [w_role_name.remote_carry]: 1,
            [w_role_name.remote_reserve]: 1,
            [w_role_name.claim_start]: 0,
            [w_role_name.remote_builder]: 0,
            [w_role_name.remote_repair]: 1,
            [w_role_name.remote_harvester]: 1,
        },
        reserve: {
            E18S4: [{ id: '5bbcadfd9099fc012e638421', container_id: '', container_pos: [31, 39] }],
            // E19S5: [{ id: '5bbcae0b9099fc012e6385b1', container_id: '' }],
        },
        // claims: {
        //     name: 'E13S5',
        //     creep: [
        //         [w_role_name.claim_start, 1],
        //         // [w_role_name.builder, 1],
        //         // [w_role_name.upgrader, 1],
        //     ],
        // },
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
    },
};
