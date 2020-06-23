const mongoose = require('mongoose');
const ret= mongoose.connect('mongodb://localhost:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

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

function getData(memPath) {
    console.log('get');
    return new Promise((resolve, reject) => {
        statsModel.find({}, function (err, data) {
            console.log('re');
            if (err) {
                console.log('err');
                return resolve([]);
            }
            if (Array.isArray(data)) {
                const dataSet= data.map(d=> {
                    return Object.assign({create_at:data.create_at},d.stats)
                });
                return resolve(dataSet)
            }else{
                console.log('no dat');
                return resolve([])
            }
        });
    });
}

module.exports = { getData: getData };
