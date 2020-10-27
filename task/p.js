// "use strict";
// exports.__esModule = true;
// exports.PromiseX = void 0;
// var xn = 1;
// // 自定义的可以取消的 promise 可以根据需要定制
// var PromiseX = /** @class */ (function () {
//     function PromiseX(executor) {
//         var _this = this;
//         this.xn = 0;
//         this._isCancel = false;
//         this.resolveQue = [];
//         this._data = undefined;
//         this.error = undefined;
//         // 0:unset 1:resolved 2:rejected 3:finally-done
//         this.status = 0;
//         this.cancel = function () {
//             _this._isCancel = true;
//             return null;
//         };
//         this.then = function (onSuccess) {
//             var newOne = new PromiseX(function (resolve, reject) {
//                 var onSuc = function () {
//                     try {
//                         var ret = onSuccess(_this._data);
//                         if (ret instanceof PromiseX) {
//                             ret.then(resolve);
//                         }
//                         else if (ret !== undefined) {
//                             _this._data = ret;
//                             resolve(ret);
//                         }
//                     }
//                     catch (e) {
//                         _this.reject(e);
//                     }
//                 };
//                 _this.resolveQue.push(onSuc);
//             });
//             newOne.prev = _this;
//             _this.next = newOne;
//             return _this.next;
//         };
//         this["catch"] = function (callback) {
//             var target = _this;
//             while (target.prev) {
//                 target = target.prev;
//             }
//             console.log('set catch', target.xn);
//             target.errorCb = callback;
//             return _this;
//         };
//         this["finally"] = function (callback) {
//             _this.finalCb = callback;
//             return _this;
//         };
//         this.resolve = function (v) {
//             _this._data = v;
//             setTimeout(function () {
//                 if (!_this._isCancel && _this.status === 0) {
//                     _this.resolveQue.forEach(function (fn) {
//                         fn();
//                     });
//                     _this.status = 1;
//                 }
//             }, 0);
//         };
//         this.reject = function (e) {
//             _this.error = e;
//             console.log('rej', _this.xn);
//             setTimeout(function () {
//                 console.log('do rej', _this.xn);
//                 if (!_this._isCancel && _this.status === 0) {
//                     _this.errorCb(_this.error);
//                     _this.status = 2;
//                 }
//             }, 0);
//         };
//         this.xn = xn;
//         xn += 1;
//         try {
//             executor(this.resolve, this.reject);
//         }
//         catch (e) {
//             this.reject(e);
//         }
//     }
//     return PromiseX;
// }());
// exports.PromiseX = PromiseX;
// var p = new PromiseX(function (resolve) {
//     setTimeout(function () {
//         resolve(5);
//     }, 1000);
//     throw new Error('err 2');
// });
// p.then(function (res) {
//     console.log('suc1', res);
//     throw new Error('err 1');
//     return new PromiseX(function (resolve) {
//         setTimeout(function () {
//             console.log('tim2');
//             resolve(44);
//         }, 500);
//     });
// }).then(function (res) {
//     console.log('suc2', res);
// });
// p.then(function (res) {
//     console.log('sucX', res);
// })["catch"](function (e) {
//     console.log('catch1', e);
// });
