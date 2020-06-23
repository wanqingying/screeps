// const mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost:27017/test', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });
//
// let str = {
//     // gcl: 35.87133354841223,
//     // gclLevel: 2,
//     // gpl: 0,
//     // gplLevel: 0,
//     // cpu: 5.301210799996625,
//     // bucket: 10000,
//     rooms: { E18S5: { storageEnergy: 432194 } },
//     // gcl_increase: 315,
//     // gcl_count: 1534587,
//     E18S5: { controller_points: 140894, storageEnergy: 357798 },
// };
//
// var Schema = mongoose.Schema;
// var blogSchema = new Schema({
//     create_at: Number,
//     gcl: Number,
//     gcl_rate: Number,
//     gcl_increase: Number,
//     gpl: Number,
//     gpl_rate: Number,
//     bucket: Number,
//     cpu: Number,
//     tick: Number,
//     rooms: Object,
// });
// const stat = mongoose.model('stat', blogSchema);
//
// function findTick(tick) {
//     return new Promise((resolve, reject) => {
//         stat.findOne({ tick: tick }, function (err, data) {
//             if (err) {
//                 return reject(err);
//             }
//             if (!data) {
//                 return resolve(true);
//             }
//             if (data.tick) {
//                 resolve(false);
//             }
//         });
//     });
// }
//
// function save(data) {
//     data.create_at = Date.now().valueOf();
//     return new Promise((resolve, reject) => {
//         findTick(data.tick).then(fine => {
//             if (fine) {
//                 const sc = new stat(data);
//                 sc.save(function (err) {
//                     if (err) {
//                         reject(err);
//                     } else {
//                         resolve('ok');
//                     }
//                 });
//             }
//         });
//     });
// }
//
// function test() {
//     stat.find({}, function (err, data) {
//         debugger;
//     });
// }
// function test2() {
//     stat.deleteMany({}, function (err, data) {
//         debugger;
//     });
// }
//
// test2();
//
// module.exports = { save };
