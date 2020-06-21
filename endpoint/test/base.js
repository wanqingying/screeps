const axios = require('axios')

axios.post('https://screeps.com/api/auth/signin',{
    "email": "1336753721@qq.com",
    "password": "wan@com123"
}).then(res=>{
    console.log('token',res.data);
    // let obj=JSON.parse(res)
    debugger
    axios.get('https://screeps.com/api/game/room-overview?interval=8&room=E18S5&shard=shard3',{
       headers:{'X-Token':res.data.token}
    }).then(res=>{
        debugger;
        console.log('done',res.data);
    })
})