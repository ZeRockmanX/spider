var express = require('express');
var app = express();

app.get('/', function (request, response) {
    response.send('Hello World');
});

var server = app.listen(3000, function () {
    console.log('Service start : localhost:3000');
});