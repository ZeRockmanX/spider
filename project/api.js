let dbCURD = require("./util/dbCURD");
let httpHandle = require("./util/httpHandle");

let cheerio = require("cheerio");
let md5 = require("md5");

module.exports = {
    getById: async function (article_id) {
        if (article_id) {
            let information = await dbCURD.SelectById(article_id);

            async function trimJson(information) {
                for (let k = 0; k < information.length; k++) {
                    delete information[k]["_id"];
                    delete information[k]["hash"];
                    delete information[k]["originData"];
                }
                return information;
            }

            return await trimJson(information);
        } else {
            return null;
        }
    },

    collectById: async function (itemUrl, article_id) {
        console.log(itemUrl);
        let downloadData = await httpHandle.getDownload(itemUrl);
        if (downloadData) {
            $ = cheerio.load(downloadData);
            $("a").each(async function (i, e) {
                let reg = /^(https:\/\/review\.rakuten\.co\.jp\/item)(.*)(\/1\.1\/)$/gi;
                if (reg.test($(e).attr("href"))) {
                    await getComments($(e).attr("href"), article_id);
                }
            });
        }
    }

};

let getComments = async function recursiveComments(commentsUrl, article_id) {
    console.log(commentsUrl);
    let commentData = await httpHandle.getDownload(commentsUrl);
    if (commentData) {
        //获取当页评论
        $originData = cheerio.load(commentData);

        $originData(".revRvwUserSec").each(async function (i, originData) {
            async function collectComments(originData) {
                let hash = md5($originData(originData).html());
                // 存在相同数据则不添加
                dbCURD.checkhash(hash, article_id).then((resolve) => {
                    if (!resolve) {
                        let reviewDate = '';
                        let level = '';
                        let label = '';
                        let comment = '';

                        $ = cheerio.load($originData(originData).html());
                        // 评论日期
                        $(".revUserEntryDate").each(async function (i, revUserEntryDate) {
                            reviewDate += $(revUserEntryDate).text();
                        });
                        // 五星等级
                        $(".revUserRvwerNum").each(async function (i, revUserRvwerNum) {
                            level += $(revUserRvwerNum).text();
                        });
                        // 标签参数
                        // 利用者サイズ: トップスXL 以上  商品の使いみち:イベント商品を使う人:自分用購入した回数:はじめて
                        $(".revRvwUserDisp").each(async function (i, revRvwUserDisp) {
                            label += $(revRvwUserDisp).text();
                        });
                        // 评论内容
                        $(".description").each(async function (i, description) {
                            comment += $(description).text();
                        });
                        let insertData = {
                            articleId: article_id,
                            reviewDate: reviewDate,
                            level: level,
                            label: label,
                            description: comment,
                            hash: hash,
                            originData: $originData(originData).html()
                        };
                        dbCURD.collectinsertMongo(insertData, article_id);
                    }
                });
            }

            await collectComments(originData);
        });
        // 查找是否有下一页入口, 有则递归调用本函数
        $originData("a").each(async function (i, e) {
            let reg = /^(次の15件)(.*)$/gi;
            if (reg.test($(e).text())) {
                await getComments($(e).attr("href"), article_id);
            }
        });
        return (commentData);
    }
};