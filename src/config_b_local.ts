//=============1==2====3====4=====5=====6
// body [-300, 0, 250, 500, 1000, 1500, 2000, 5000, 12000]
const w = global.w_role_name;
export const cfg_local: { [k: string]: CfgRoom } = {
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
        claims: {
            name: 'W1N8',
            creep: [
                // [w_role_name.harvester, 1],
                // [w_role_name.builder, 1],
                // [w_role_name.upgrader, 1],
            ],
        },
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
    },
    W2N7: {
        creep_cfg_num: {
            [w_role_name.starter]: 0,
            [w_role_name.carrier]: 2,
            [w_role_name.remote_carry]: 9,
            [w_role_name.scout]: 0,
            [w_role_name.builder]: 1,
            [w_role_name.harvester]: 2,
            [w_role_name.remote_harvester]: 4,
            [w_role_name.remote_reserve]: 1,
            [w_role_name.upgrader]: 1,
            [w_role_name.repair]: 0,
        },
        reserve: {
            W3N7: [{ id: 'eff307740862fd8', container_id: '' }, { id: 'eee50774086309c' }],
            W3N8: [{ id: 'ebdd0774017409d', container_id: '' }, { id: '9d330774017e6b9' }],
        },
        scout: ['W4N7'],
        remote_container: ['3ae357adc2e6a21'],
    },
};
