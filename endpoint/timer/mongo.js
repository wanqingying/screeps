const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).catch(e=>console.log(e));


const Schema = mongoose.Schema;
const statsSchema = new Schema({
    create_at: Number,
    tick: Number,
    stats:Object
});

const statsModel = mongoose.model('stats', statsSchema);

function findMsgByTick(tick) {
    return new Promise((resolve, reject) => {
        statsModel.findOne({ tick: tick }, function (err, data) {
            if (err) {
                return reject(err);
            }
            if (!data) {
                return resolve(true);
            }
            if (data.tick) {
                resolve(false);
            }
        });
    });
}

function trySaveMsg(data) {
    const create_at = Date.now().valueOf();
    const tick=data.tick;
    if (typeof tick!=='number'){
        return;
    }
    return new Promise((resolve, reject) => {
        findMsgByTick(tick).then(fine => {
            if (fine) {
                const sc = new statsModel({ tick:tick,create_at:create_at,stats:data });
                sc.save(function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve('ok');
                    }
                }).catch(reject);
            }else{
                reject('err_exist')
            }
        });
    });
}

module.exports = { trySaveMsg: trySaveMsg };
