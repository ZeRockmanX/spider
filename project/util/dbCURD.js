let MongoClient = require('mongodb').MongoClient;

//let dbUrl = 'mongodb://X0575:27017';
let dbUrl = 'mongodb://localhost:27017';
let dbName = "spider_rakuten";
let collectionPrefixion = "Article_";

module.exports = {
    SelectById: async function select(article_id) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(dbUrl, async function (err, db) {
                if (err) {
                    throw err;
                } else {
                    var dbo = db.db(dbName);
                }
                await dbo.collection(collectionPrefixion + article_id).find({}, {}).toArray(function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log("select success");
                        resolve(result);
                    }
                    db.close();
                });
            });
        });
    },

    collectinsertMongo: function insert(insertData, article_id) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(dbUrl, async function (err, db) {
                if (err) {
                    throw err;
                } else {
                    var dbo = db.db(dbName);
                }
                await dbo.collection(collectionPrefixion + article_id).insertOne(insertData, function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log("insert success");
                        resolve(result);
                    }
                    db.close();
                });
            });
        });
    },

    checkhash: function select(hash, article_id) {
        return new Promise(async function (resolve, reject) {
            MongoClient.connect(dbUrl, async function (err, db) {
                if (err) {
                    throw err;
                } else {
                    var dbo = db.db(dbName);
                }
                let whereStr = {"hash": hash};  // 查询条件
                await dbo.collection(collectionPrefixion + article_id).find(whereStr).count(function (err, count) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(count);
                    }
                });
                db.close();
            });
        });
    }
};



