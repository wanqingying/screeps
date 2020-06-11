// const counter:Function[][]=[];
//
// // setTimeout
// global.w_set_tick_out=function(tick:number,callback:Function) {
//     const prev=counter[tick];
//     if (Array.isArray(prev)){
//         prev.push(callback);
//     }else{
//         counter[tick]=[callback]
//     }
// }
//
// export function tick_counter_execute() {
//     const fn_list=counter.shift();
//     if (fn_list&&Array.isArray(fn_list)){
//         fn_list.forEach(fn=>{
//             fn(Game.time)
//         })
//     }
// }
