const { ScreepsAPI } = require('screeps-api');
const fs = require('fs');


// Supports @tedivm's [Unified Credentials File format](https://github.com/screepers/screepers-standards/blob/34bd4e6e5c8250fa0794d915d9f78d3c45326076/SS3-Unified_Credentials_File.md) (Pending [screepers-standard PR #8](https://github.com/screepers/screepers-standards/pull/8))
// const api = await ScreepsAPI.fromConfig('main', 'appName')
// This loads the server config 'main' and the configs section 'appName' if it exists
// config section can be accessed like this:
// If making a CLI app, its suggested to have a `--server` argument for selection
// console.log(api.appConfig.myConfigVar)

// All options are optional
const api = new ScreepsAPI({
    token: 'eba03bfe-bc7c-48bc-89b2-50a4665bf574',
    protocol: 'https',
    hostname: 'screeps.com',
    port: 443,
    path: '/' // Do no include '/api', it will be added automatically
});

// You can overwrite parameters if needed
api.auth('1336753721@qq.com','wan@com123',{
    protocol: 'https',
    hostname: 'screeps.com',
    port: 443,
    path: '/' // Do no include '/api', it will be added automatically
})

// If you want to point to the screeps PTR (Public Test Realm),
// you can set the 'path' option to '/ptr' and it will work fine.

// Dump Memory
// api.memory.get()
//     .then(memory => {
//         fs.writeFileSync('memory.json', JSON.stringify(memory))
//     })
//     .catch(err => console.error(err));

// api.memory.get()

// Dump Memory Path
api.memory.get('stats','shard3')
    .then(memory => {
        console.log('memory', JSON.stringify(memory));
        debugger;
        fs.writeFileSync('memory.rooms.E18S5.json', JSON.stringify(memory))
    })
    .catch(err => console.error(err));



// Get user info
// api.me().then((user)=>console.log(user.username))

// Socket API

api.socket.connect()
// Events have the structure of:
// {
//   channel: 'room',
//   id: 'E3N3', // Only on certain events
//   data: { ... }
// }
api.socket.on('connected',()=>{
    // Do stuff after connected
})

// api.socket.on('auth',(event)=>{
//     console.log('auth',event.data.ok);
//     // event.data.status contains either 'ok' or 'failed'
//     // Do stuff after auth
// })

// Events: (Not a complete list)
// connected disconnected message auth time protocol package subscribe unsubscribe console

// Subscribtions can be queued even before the socket connects or auths,
// although you may want to subscribe from the connected or auth callback to better handle reconnects

// api.socket.subscribe('console')
// api.socket.on('console',(event)=>{
//     console.log('console:',event.data);
//
//     // event.data.messages.log // List of console.log output for tick
// })


// Starting in 1.0, you can also pass a handler straight to subscribe!
// api.socket.subscribe('console', (event)=>{
//     console.log('console:',event.data);
//     // event.data.messages.log // List of console.log output for tick
// })

// More common examples
// api.socket.subscribe('cpu',(event)=>console.log('cpu',event.data))
// api.code.get('default').then(data=>console.log('code',data))
// api.code.set('default',{
//     main: 'module.exports.loop = function(){ ... }'
// })
// api.socket.subscribe('memory/stats',(event)=>{
//     console.log('stats',event.data)
// })
// api.socket.subscribe('memory/rooms.E18S5',(event)=>{
//     console.log('E18S5 Memory',event.data)
// })