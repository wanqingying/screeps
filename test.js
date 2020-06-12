

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