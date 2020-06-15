

const cache={};
function getCache(key) {
    let che=cache[key]
    if (!che){
        che={tick:555}
        cache[key]=che;
    }
    return che
}

function test() {
    let che=getCache('test');
    console.log(che);
    che.tick=88
    console.log(che);
}
test()

let k=4*3;
//1500 tick
//total=6000*(1500/300)=30000;
// builder 700*2=1400
// carry   750*2=1500
// upgrader 1200*2=2400
// repair  800
// cost     5100
// upgrade 20*1500=30000;
//
let upgrade_cost=k*300;
