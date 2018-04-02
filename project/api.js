let dbCURD = require("./util/dbCURD");
let httpHandle = require("./util/httpHandle");

let cheerio = require("cheerio");
let md5 = require("md5");

module.exports = {
    getById: function (article_id) {
        return new Promise(async (resolve, reject) => {
            if (article_id) {
                let information = await dbCURD.SelectById(article_id);

                function trimJson(information) {
                    for (let k = 0; k < information.length; k++) {
                        delete information[k]["_id"];
                        delete information[k]["hash"];
                        delete information[k]["originData"];
                    }
                    return information;
                }

                resolve(trimJson(information));
            } else {
                reject(null);
            }
        });
    },

    collectById: function (itemUrl, article_id) {
        return new Promise(async function (resolve, reject) {
            try {
                console.log(itemUrl);
                let downloadData = await httpHandle.getDownload(itemUrl);
                if (downloadData) {
                    $originDownloadData = cheerio.load(downloadData);
                    let actions = [];
                    $originDownloadData("a").each(async function (i, downloadOriginDataData) {
                        actions.push(async () => {
                            let reg = /^(https:\/\/review\.rakuten\.co\.jp\/item)(.*)(\/1\.1\/)$/gi;
                            if (reg.test($originDownloadData(downloadOriginDataData).attr("href"))) {
                                await getComments($originDownloadData(downloadOriginDataData).attr("href"), article_id);
                            }
                        });
                    });
                    for (let action of actions) {
                        await action();
                    }
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

};

let getComments = function recursiveComments(commentsUrl, article_id) {
    return new Promise(async function (resolve, reject) {
        try {
            console.log(commentsUrl);
            let commentData = await httpHandle.getDownload(commentsUrl);
            if (commentData) {
                //获取当页评论
                $originData = cheerio.load(commentData);
                let actions = [];
                $originData(".revRvwUserSec").each(async function (i, originData) {
                    actions.push(async () => {
                        let hash = await md5($originData(originData).html());
                        // 存在相同数据则不添加
                        let result = await dbCURD.checkhash(hash, article_id);
                        if (!result) {
                            let reviewDate = '';
                            let level = '';
                            let label = '';
                            let comment = '';

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
                            let insertData = {
                                articleId: article_id,
                                reviewDate: reviewDate,
                                level: level,
                                label: label,
                                description: comment,
                                hash: hash,
                                //originData: $originData(originData).html()
                            };
                            await dbCURD.collectinsertMongo(insertData, article_id);
                        }
                    });
                });
                // 查找是否有下一页入口, 有则递归调用本函数
                let nextactions = [];
                $originData("a").each(async function (i, e) {
                    actions.push(async () => {
                        let reg = /^(次の15件)(.*)$/gi;
                        if (reg.test($originData(e).text())) {
                            await getComments($originData(e).attr("href"), article_id);
                        }
                    });
                });
                // 执行上面递归的each
                for (let nextaction of nextactions) {
                    await nextaction();
                }
                // 执行当前页的each
                for (let action of actions) {
                    await action();
                }
            }
            resolve();
        } catch (error) {
            reject(error);
        }

    });
};