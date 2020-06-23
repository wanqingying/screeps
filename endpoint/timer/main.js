const axios = require('axios');
const zlib = require('zlib');
const utils = require('util');
const { trySaveMsg } = require('./mongo');

const gunzipAsync = utils.promisify(zlib.gunzip);

async function gz(data) {
    const buf = Buffer.from(data.slice(3), 'base64');
    const ret = await gunzipAsync(buf);
    return JSON.parse(ret.toString());
}


const memoryUrl = 'https://screeps.com/api/user/memory';
const memoryPath = 'stats';
const shard = 'shard3';
const token = 'eba03bfe-bc7c-48bc-89b2-50a4665bf574';


const timeMap = new Map();

function fetchData() {
    axios
        .get(`${memoryUrl}?path=${memoryPath}&shard=${shard}`, {
            headers: { 'X-Token': token },
        })
        .then(async res => {
            const data = res.data.data;
            const msg = await gz(data);
            trySaveMsg(msg).then(r => {
                console.log('ok');
            }).catch(err => {
                if (err === 'err_exist') {
                    // ignore
                }
            });
        }).catch(e => {
        // ignore
    });
}

function main() {
    setInterval(fetchData, 1000 * 60*2);
}

main();