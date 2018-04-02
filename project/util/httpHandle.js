let https = require('https');
let iconv = require('iconv-lite');

module.exports = {
    getDownload: function download(url) {
        return new Promise(function (resolve, reject) {
            https.get(url, function (res) {
                let data = "";
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
    }

};
