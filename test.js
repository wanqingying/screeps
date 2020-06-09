

function lock(fn) {
    let name=999;
    function log(k) {
        console.log(k);
    }
    fn()

    return {name,log}
}

function main() {
    let {name,log}=lock((n)=>{
        log()
    })
}

main()