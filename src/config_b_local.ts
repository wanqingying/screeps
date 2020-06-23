//=============1==2====3====4=====5=====6
// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]
const w = global.w_role_name;
export const cfg_local: { [k: string]: CfgRoom } = {
    W1N7: {
        creep_cfg_num: {
            [w.starter]: 0,
            [w.carrier]: 1,
            [w.scout]: 0,
            [w.builder]: 1,
            [w.harvester]: 2,
            [w.upgrader]: 1,
            [w.repair]: 0,
        },
        link_a: ['41560dd9b7d200a'],
        link_pair: [['41560dd9b7d200a', '75ae0e324f8ba55']],
    },
    W1N8: {
        creep_cfg_num: {
            [w.starter]: 0,
            [w.carrier]: 2,
            [w.scout]: 0,
            [w.builder]: 1,
            [w.harvester]: 2,
            [w.upgrader]: 2,
            [w.repair]: 1,
            [w.attack]: 1,
        },
    },
    W2N7: {
        creep_cfg_num: {
            [w.starter]: 0,
            [w.carrier]: 1,
            [w.scout]: 0,
            [w.builder]: 1,
            [w.harvester]: 2,
            [w.upgrader]: 1,
            [w.repair]: 0,
            [w.remote_repair]: 0,
            [w.remote_carry]: 2,
            [w.remote_builder]: 1,
            [w.remote_harvester]: 0,
            [w.remote_reserve]: 0,
        },
        reserve: {
            W3N7: [
                { id: 'eff307740862fd8', container_pos: [12, 22] },
                { id: 'eee50774086309c', container_pos: [37, 4] },
            ],
            // W3N8: [
            //     { id: 'ebdd0774017409d', container_pos: [41, 37] },
            //     { id: '9d330774017e6b9', container_pos: [34, 4] },
            // ],
        },
        scout: ['W4N7'],
        remote_container: ['3ae357adc2e6a21'],
        // 用于采矿
        link_a: ['1989f91647cdd7c'],
        // 用于接受其他link
        link_out: ['351efa7ee58125c'],
        // 用于发送能量
        link_in: [],
        // 传输配对
        link_pair: [['1989f91647cdd7c', '351efa7ee58125c']],
        claims: {
            name: 'W3N8',
            creep: [
                [w_role_name.claim_start, 1],
                // [w_role_name.builder, 1],
                // [w_role_name.upgrader, 1],
            ],
        },
    },
};
