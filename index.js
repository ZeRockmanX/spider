//npm install express --save(类似jquery的选择器)
var express = require('express');
var app = express();

//npm install mongodb --save
var MongoClient = require('mongodb').MongoClient;
var dbUrl = 'mongodb://localhost:27017';

//npm install cheerio --save(类似jquery的选择器)
var cheerio = require("cheerio");
var https = require('https');
var http = require('http');
var fs = require('fs');
//npm install iconv-lite --save(解决乱码)
var iconv = require('iconv-lite');

var url = "https://item.rakuten.co.jp/auc-pourvous/";
//var detailurl = "https://review.rakuten.co.jp/item/1/252883_10010830/1.1/";
var id = 1727;
var idMax = 1728;

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
                            reviewDate += $(revUserEntryDate).html();
                        });
                        // 五星等级
                        $(".revUserRvwerNum").each(function (i, revUserRvwerNum) {
                            level += $(revUserRvwerNum).html();
                        });
                        // 标签参数
                        // 利用者サイズ: トップスXL 以上  商品の使いみち:イベント商品を使う人:自分用購入した回数:はじめて
                        $(".revRvwUserDisp").each(function (i, revRvwUserDisp) {
                            label += $(revRvwUserDisp).html();
                        });
                        // 评论内容
                        $(".description").each(function (i, description) {
                            comment += $(description).html();
                        });
                        var insertData = {
                            reviewDate: reviewDate,
                            level: level,
                            label: label,
                            description: comment,
                            originData: $originData(originData).html()
                        };
                        await insertMongo(insertData);
                    });
                });
                for (let insertMongoAction of insertMongoActions) {
                    await insertMongoAction();
                }
            }
            //查找是否有下一页入口, 有则递归调用本函数
            let actions = [];
            $("a").each(function (i, e) {
                actions.push(async () => {
                    let reg = /^(次の15件)(.*)$/gi;
                    if (reg.test($(e).text())) {
                        //console.log($(e).attr("href"));
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

app.get('/', function (request, response) {
    let waits = [];
    (async () => {
        for (let ivd = id; ivd <= idMax; ivd++) {
            commentcsUrl = url + ivd + "/";
            console.log(commentcsUrl);
            let downloadData = await getDownload(commentcsUrl);
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
        response.end('process success');
    })();
});

var server = app.listen(3000, function () {
    console.log('Service start : localhost:3000');
});