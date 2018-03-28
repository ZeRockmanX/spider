//npm install mongodb --save(mongoDB)
//npm install cheerio --save(类似jquery的选择器)
//npm install iconv-lite --save(解决汉字乱码)
//npm install md5 --save
//npm install express --save(类似jquery的选择器)
let express = require('express');
let app = express();
//npm install ejs --save(模版引擎)
app.set('views', './views');
app.set('view engine', 'html');
app.engine('.html', require('ejs').__express);

let apiFunc = require('./api');
let baseUrl = "https://item.rakuten.co.jp/auc-pourvous/";

app.get('/', function (request, response) {
    console.log("Welcome To Debug Page");
    response.render('information', {title: 'Spider', message: ''});
});

app.get('/api', async function (request, response) {
    let article_id = "";
    let action = request.query.action;

    switch (action) {
        case "getComments":
            article_id = request.query.id;
            let resData = await apiFunc.getById(article_id);
            response.render('api', {title: 'Spider', message: JSON.stringify(resData)});
            break;
        case "collectComments":
            article_id = request.query.id;
            try {
                let itemUrl = baseUrl + article_id + "/";
                await apiFunc.collectById(itemUrl, article_id);
                response.render('api', {title: 'Spider', message: '[{Result:1}]'});
            } catch (err) {
                console.log(err);
                response.render('api', {title: 'Spider', message: '[{Result:0}]'});
            }
            break;
        default:
    }
    response.end('asv');
});

app.get('/information', async function (request, response) {
    let resData = await apiFunc.getById("1727");
    response.render('information', {title: 'Spider', message: resData});
    response.end();
});

let port = 8000;
app.listen(port, function () {
    console.log('Service start : localhost:' + port);
});
