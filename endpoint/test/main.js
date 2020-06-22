const { execSync }=require('child_process')


async function tick() {
    return  execSync('node ./base.js')
}

function run() {
    setInterval(tick,3000)
    // tick().then(res=>console.log('ok'))
}

run()