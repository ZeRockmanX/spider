var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

MongoClient.connect(url, function (err, db) {
    if (err) {
        throw err;
    } else {
        console.log('数据库已连接');
    }

    let dbase = db.db("spider_db");
    dbase.createCollection('data', function (err, res) {
        if (err) {
            throw err;
        } else {
            console.log("创建集合!");
        }

        db.close();
    });
});