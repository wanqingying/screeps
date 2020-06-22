const axios = require('axios')
const zlib=require('zlib')
const utils=require('util')
const fs=require('fs')

const gunzipAsync = utils.promisify(zlib.gunzip)

async function gz (data) {
    const buf = Buffer.from(data.slice(3), 'base64')
    const ret = await gunzipAsync(buf)
    return JSON.parse(ret.toString())
}
let tk=Date.now();

function run (){
    const ta=Date.now();
    console.log('start',ta-tk);
    tk=ta;
    axios.post('https://screeps.com/api/auth/signin',{
        "email": "1336753721@qq.com",
        "password": "wan@com123"
    }).then(res=>{
        console.log('token',res.data);
        // let obj=JSON.parse(res)
        axios.get('https://screeps.com/api/user/memory?path=stats&shard=shard3',{
            headers:{'X-Token':res.data.token}
        }).then(async res=>{
            let res_data=res.data.data;
            let msg= await gz(res_data);
            let f=fs.readFileSync('./out.json');
            f=f.toString()+"\n"+JSON.stringify(msg);
            fs.writeFileSync('./out.json',f)
            const tc=Date.now();
            console.log('done',tc-ta);
        })
    })
}

function main() {
    setInterval(run,6000)
}
main();