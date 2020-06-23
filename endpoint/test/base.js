const axios = require('axios');
const zlib = require('zlib');
const utils = require('util');
const fs = require('fs');
const { save } = require('./mongo');

const gunzipAsync = utils.promisify(zlib.gunzip);

async function gz(data) {
    const buf = Buffer.from(data.slice(3), 'base64');
    const ret = await gunzipAsync(buf);
    return JSON.parse(ret.toString());
}
let tk = Date.now();

function run() {
    const ta = Date.now();
    console.log('start', ta - tk);
    tk = ta;
    axios
        .post('https://screeps.com/api/auth/signin', {
            email: '1336753721@qq.com',
            password: 'wan@com123',
        })
        .then(res => {
            console.log('token', res.data);
            // let obj=JSON.parse(res)
            axios
                .get('https://screeps.com/api/user/memory?path=stats&shard=shard3', {
                    // headers: { 'X-Token': res.data.token },
                    headers: { 'X-Token': 'eba03bfe-bc7c-48bc-89b2-50a4665bf574' },
                })
                .then(async res => {
                    let res_data = res.data.data;
                    let msg = await gz(res_data);
                    save(msg).then(r => {
                        debugger;
                    });
                    console.log('done', Date.now() - ta);
                });
        });
}

function main() {
    setInterval(run, 1000 * 30);
}
main();
