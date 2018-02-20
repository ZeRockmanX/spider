//news:crawler github 已有的爬虫库
//npm install cheerio (类似jquery的选择器)
var cheerio = require("cheerio");
var https = require('https');
var http = require('http');
var fs = require('fs');
//npm install iconv-lite (解决乱码)
var iconv = require('iconv-lite');

var url = "https://item.rakuten.co.jp/auc-pourvous/";
//var detailurl = "https://review.rakuten.co.jp/item/1/252883_10010830/1.1/";
var id = 1727;
var idMax = 1728;

var getComments = function recursiveComments(url, response, id) {
    return new Promise(function (resolve, reject) {
        (async () => {
            let commentData = await getDownload(url);
            if (commentData) {
                //获取当页评论
                $ = cheerio.load(commentData);
                $(".revRvwUserSec").each(function (i, e) {
                    response.write("<H3>---------<span>Article ID " + id + "</span>--------------------------------------------------------------------------------</H3>");
                    response.write($(e).html());
                });
            }
            //查找是否有下一页入口, 有则递归调用本函数
            let actions = [];
            $("a").each(function (i, e) {
                actions.push(async () => {
                    let reg = /^(次の15件)(.*)$/gi;
                    if (reg.test($(e).text())) {
                        console.log($(e).attr("href"));
                        await recursiveComments($(e).attr("href"), response, id);
                    }
                })
            });
            for (let action of actions) {
                await action()
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

http.createServer(function (request, response) {
        response.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
        if (request.url != '/favicon.ico') {
            var waits = [];
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
                                var reg = /^(https:\/\/review\.rakuten\.co\.jp\/item)(.*)(\/1\.1\/)$/gi;
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
                response.end();
            })();


//async,await EX:
// var sleep = function (time) {
//     return new Promise(function (resolve, reject) {
//         setTimeout(function () {
//             console.log("第次异步完成了，可以进行下次循环");
//             resolve();
//         }, time);
//     })
// };
// (async () => {
//     for (var i = 1; i < 6; i++) {
//         await sleep(1000);
//     }
//     await console.log("第一个for循环结束再接着执行下一个循环");
//     for (var v = 11; v < 13; v++) {
//         console.log(`当前是第${v}次等待..`);
//         await console.log("第" + v + "次异步完成了，可以进行下次循环");
//     }
//     console.log("所有循环结束执行监听结束");
//     response.end();
// })();
        }
    }
).listen(8000);
console.log('Server starting please access http://127.0.0.1:8000');




