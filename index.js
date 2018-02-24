//npm install express --save(类似jquery的选择器)
var express = require('express');
var app = express();

//npm install mongodb --save(mongoDB)
var MongoClient = require('mongodb').MongoClient;
//var dbUrl = 'mongodb://X0575:27017';
var dbUrl = 'mongodb://localhost:27017';

//npm install cheerio --save(类似jquery的选择器)
var cheerio = require("cheerio");
var https = require('https');

//npm install iconv-lite --save(解决汉字乱码)
var iconv = require('iconv-lite');

//npm install ejs --save(模版引擎)
app.set('views', './views');
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

var url = "https://item.rakuten.co.jp/auc-pourvous/";
//var detailurl = "https://review.rakuten.co.jp/item/1/252883_10010830/1.1/";

var id = 1727;
var idMax = 1727;

var getComments = function recursiveComments(url, response, id) {
    return new Promise(function (resolve, reject) {
        (async () => {
            let commentData = await getDownload(url);
            let insertMongoActions = [];
            if (commentData) {
                //获取当页评论
                $originData = cheerio.load(commentData);
                $originData(".revRvwUserSec").each(function (i, originData) {
                    insertMongoActions.push(async () => {
                        var reviewDate = '';
                        var level = '';
                        var label = '';
                        var comment = '';
                        $ = cheerio.load($originData(originData).html());
                        // 评论日期
                        $(".revUserEntryDate").each(function (i, revUserEntryDate) {
                            reviewDate += $(revUserEntryDate).text();
                        });
                        // 五星等级
                        $(".revUserRvwerNum").each(function (i, revUserRvwerNum) {
                            level += $(revUserRvwerNum).text();
                        });
                        // 标签参数
                        // 利用者サイズ: トップスXL 以上  商品の使いみち:イベント商品を使う人:自分用購入した回数:はじめて
                        $(".revRvwUserDisp").each(function (i, revRvwUserDisp) {
                            label += $(revRvwUserDisp).text();
                        });
                        // 评论内容
                        $(".description").each(function (i, description) {
                            comment += $(description).text();
                        });
                        var insertData = {
                            reviewDate: reviewDate,
                            level: level,
                            label: label,
                            description: comment,
                            originData: $originData(originData).html()
                        };
                        insertMongo(insertData);
                    });
                });
                for (let insertMongoAction of insertMongoActions) {
                    await insertMongoAction();
                }
            }
            // 查找是否有下一页入口, 有则递归调用本函数
            let actions = [];
            $("a").each(function (i, e) {
                actions.push(async () => {
                    let reg = /^(次の15件)(.*)$/gi;
                    if (reg.test($(e).text())) {
                        await getComments($(e).attr("href"), response, id);
                    }
                })
            });
            for (let action of actions) {
                await action();
            }
            resolve(commentData);
        })();

    })
};

var getDownload = function download(url) {
    return new Promise(function (resolve, reject) {
        https.get(url, function (res) {
            var data = "";
            res.on('data', function (chunk) {
                data += iconv.decode(chunk, 'EUC-JP');
            });
            res.on("end", function () {
                resolve(data);
            });
        }).on("error", function () {
            reject(null);
        });
    });
};

var insertMongo = function insert(insertData) {
    MongoClient.connect(dbUrl, function (err, db) {
        if (err) {
            throw err;
        } else {
            var dbo = db.db("spider_db");
        }
        dbo.collection("rakuten").insertOne(insertData, function (err, res) {
            if (err) {
                throw err;
            } else {
                console.log("insert success");
            }
            db.close();
        });

    });
};

var selectMongo = function select() {
    return new Promise(function (resolve, reject) {
        MongoClient.connect(dbUrl, function (err, db) {
            if (err) {
                throw err;
            } else {
                var dbo = db.db("spider_db");
            }
            dbo.collection("rakuten").find().toArray(function (err, result) { // 返回集合中所有数据
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
};

app.get('/', function (request, response) {
    response.render('index', {title: 'Spider', message: ''});
});

app.get('/execute', function (request, response) {
    let waits = [];
    (async () => {
        for (let ivd = id; ivd <= idMax; ivd++) {
            let itemUrl = url + ivd + "/";
            console.log(itemUrl);
            let downloadData = await getDownload(itemUrl);
            if (downloadData) {
                $ = cheerio.load(downloadData);

                var actions = [];
                $("a").each(function (i, e) {
                    actions.push(async () => {
                        let reg = /^(https:\/\/review\.rakuten\.co\.jp\/item)(.*)(\/1\.1\/)$/gi;
                        if (reg.test($(e).attr("href"))) {
                            console.log($(e).attr("href"));
                            await getComments($(e).attr("href"), response, ivd, idMax);
                        }
                    })
                });
                for (let action of actions) {
                    waits.push(await action());
                }
            }
        }
        response.render('index', {title: 'Spider', message: 'Process success'});
        response.end();
    })();
});

// promise
// app.get('/information', function (request, response) {
//     selectMongo().then((information) => {
//         response.render('index', {title: 'Spider', message: JSON.stringify(information)});
//         response.end();
//     });
// });

// async
app.get('/information', async function (request, response) {
    let obj = (await selectMongo());
    response.render('index', {title: 'Spider', message: obj});
    response.end();
});

var server = app.listen(8000, function () {
    console.log('Service start : localhost:8000');
});