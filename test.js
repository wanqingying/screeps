

function lock(fn) {
    let name=999;
    function log(k) {
        console.log(k);
    }
    fn()

    return {name,log}
}

function test() {
    let m=new Map();
    // m.set('fn',()=>)
}