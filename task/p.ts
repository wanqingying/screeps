// type CallFn<T> = (res: T) => any;
// let xn = 1;
// // 自定义的可以取消的 promise 可以根据需要定制
// export class PromiseX<T> {
//     private xn = 0;
//     private _isCancel = false;
//     private resolveQue: (() => any)[] = [];
//     private finalCb: any;
//     private _data: T = undefined as any;
//     private error = undefined as any;
//     private errorCb: Function;
//     // 0:unset 1:resolved 2:rejected 3:finally-done
//     private status = 0;
//     private next: PromiseX<any> | undefined;
//     private prev: PromiseX<any> | undefined;
//     constructor(executor: (resolve: (value?: T) => void, reject: (reason?: any) => void) => void) {
//         this.xn = xn;
//         xn += 1;
//         try {
//             executor(this.resolve as any, this.reject);
//         } catch (e) {
//             this.reject(e);
//         }
//     }
//     cancel = () => {
//         this._isCancel = true;
//         return null;
//     };
//     then = (onSuccess: (res: T) => any) => {
//         const newOne = new PromiseX((resolve, reject) => {
//             const onSuc = () => {
//                 try {
//                     const ret = onSuccess(this._data);
//                     if (ret instanceof PromiseX) {
//                         ret.then(resolve);
//                     } else if (ret !== undefined) {
//                         this._data = ret;
//                         resolve(ret);
//                     }
//                 } catch (e) {
//                     this.reject(e);
//                 }
//             };
//             this.resolveQue.push(onSuc);
//         });
//         newOne.prev = this;
//         this.next = newOne;
//         return this.next;
//     };
//     catch = (callback: (e: any) => void) => {
//         let target = this;
//         while (target.prev) {
//             target = target.prev as any;
//         }
//         console.log('set catch', target.xn);
//         target.errorCb = callback;
//         return this;
//     };
//     finally = (callback: (res: T) => void) => {
//         this.finalCb = callback;
//         return this;
//     };
//     private resolve = (v: T) => {
//         this._data = v;
//         setTimeout(() => {
//             if (!this._isCancel && this.status === 0) {
//                 this.resolveQue.forEach(fn => {
//                     fn();
//                 });
//                 this.status = 1;
//             }
//         }, 0);
//     };
//     private reject = (e: any) => {
//         let target = this;
//         while (target.prev) {
//             target = target.prev as any;
//         }
//         target.error = e;
//         setTimeout(() => {
//             if (!target._isCancel && target.status === 0) {
//                 target.errorCb(target.error);
//                 target.status = 2;
//             }
//         }, 0);
//     };
// }
//
// const p = new PromiseX(resolve => {
//     setTimeout(() => {
//         resolve(5);
//     }, 1000);
//     throw new Error('err 2');
// });
// p.then(res => {
//     console.log('suc1', res);
//     throw new Error('err 1');
//     return new PromiseX(resolve => {
//         setTimeout(() => {
//             console.log('tim2');
//             resolve(44);
//         }, 500);
//     });
// }).then(res => {
//     console.log('suc2', res);
// });
// p.then(res => {
//     console.log('sucX', res);
// }).catch(e => {
//     console.log('catch1', e);
// });
