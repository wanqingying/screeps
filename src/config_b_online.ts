//========0====1====2====3====4=====5=====6====7======8
// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]

export const cfg_online: { [k: string]: CfgRoom } = {
    E18S5: {
        creep_cfg_num: {
            [w_role_name.starter]: 0,
            [w_role_name.carrier]: 1,
            [w_role_name.scout]: 0,
            [w_role_name.builder]: 0,
            [w_role_name.harvester]: 2,
            [w_role_name.upgrader]: 1,
            [w_role_name.repair]: 0,
            [w_role_name.upg]: 4,
            [w_role_name.remote_carry]: 2,
            [w_role_name.remote_reserve]: 2,
            [w_role_name.remote_harvester]: 2,
            [w_role_name.claim_start]: 0,
            [w_role_name.remote_builder]: 1,
        },
        reserve: {
            E18S4: [{ id: '5bbcadfd9099fc012e638421', container_pos: [31, 39] }],
            E19S5: [{ id: '5bbcae0b9099fc012e6385b1', container_pos: [10, 18] }],
            // E19S4: [{ id: '5bbcae0b9099fc012e6385af', container_pos: [32, 46] }],
        },
        // tk: 'eba03bfe-bc7c-48bc-89b2-50a4665bf574',
        // 用于采矿 只有采矿单位使用 发送到其他link
        link_a: ['5eebf3521f88d46bee1e7a56'],
        // 用于接受其他link 单位清空此link
        link_out: [],
        // 用于发送能量 比如发送到controller 单位搬运能量到此
        link_in: [],
        // 接收能量 用于升级 单位不处理此link
        link_d: ['5ee98971418f3a4631ec8d8c'],
        // 传输配对
        link_pair: [
            // mine->controller
            ['5eebf3521f88d46bee1e7a56', '5ee98971418f3a4631ec8d8c'],
        ],
        // claims: {
        //     name: 'E15S7',
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
