

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
let total=6000*5;
let upgrade_cost=k*300;
let creep_cost=(3+3+1+2)*550;

const rest=total-creep_cost;
console.log(rest/300);