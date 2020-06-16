

const cache={};
class BaseDriver {
    constructor() {
    }
    static start = (Cls) => {
        let che=cache[Cls.key]
        if (!che){
            che=new Cls()
            console.log(Cls.name);
            cache[Cls.key]=che
        }
        che.run();
    };
}

class CarDriver2 extends BaseDriver{
    name='car_driver'
    run = () => {
        console.log(this.name);
    };
    static key='car'
}

function test() {
  // CarDriver2.start(CarDriver2)
    let obj={name:'abc'}
    let arr=[obj];
    let b=arr.pop()
    obj.name='33'
    console.log(b);
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
