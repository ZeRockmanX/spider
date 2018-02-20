// http://www.runoob.com/nodejs/nodejs-mongodb.html
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';

//插入数据
MongoClient.connect(url, function (err, db) {
    if (err) {
        throw err;
    } else {
        var dbo = db.db("runoob");
    }
    let myobj = {name: "菜鸟教程", url: "www.runoob"};
    dbo.collection("site").insertOne(myobj, function (err, res) {
        if (err) {
            throw err;
        } else {
            console.log("文档插入成功");
        }

        db.close();
    });

});

//插入多条数据
/*
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("runoob");
    var myobj =  [
        { name: '菜鸟工具', url: 'https://c.runoob.com', type: 'cn'},
        { name: 'Google', url: 'https://www.google.com', type: 'en'},
        { name: 'Facebook', url: 'https://www.google.com', type: 'en'}
       ];
    dbo.collection("site").insertMany(myobj, function(err, res) {
        if (err) throw err;
        console.log("插入的文档数量为: " + res.insertedCount);
        db.close();
    });
});
*/

//查询数据
//可以使用 find() 来查找数据, find() 可以返回匹配条件的所有数据。 如果未指定条件，find() 返回集合中的所有数据。
/*
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("runoob");
    dbo.collection("site"). find({}).toArray(function(err, result) { // 返回集合中所有数据
        if (err) throw err;
        console.log(result);
        db.close();
    });
});
 */
//查询指定条件数据数据
/*
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("runoob");
     var whereStr = {"name":'菜鸟教程'};  // 查询条件
    dbo.collection("site").find(whereStr).toArray(function(err, result) {
        if (err) throw err;
        console.log(result);
        db.close();
    });
});
 */

//更新数据
/*
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("runoob");
    var whereStr = {"name":'菜鸟教程'};  // 查询条件
    var updateStr = {$set: { "url" : "https://www.runoob.com" }};
    dbo.collection("site").updateOne(whereStr, updateStr, function(err, res) {
        if (err) throw err;
        console.log("文档更新成功");
        db.close();
    });
});
 */
// 更新多条数据
/*
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("runoob");
    var whereStr = {"type":'en'};  // 查询条件
    var updateStr = {$set: { "url" : "https://www.runoob.com" }};
    dbo.collection("site").updateMany(whereStr, updateStr, function(err, res) {
        if (err) throw err;
         console.log(res.result.nModified + " 条文档被更新");
        db.close();
    });
});
 */

//删除数据
/*
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("runoob");
    var whereStr = {"name":'菜鸟教程'};  // 查询条件
    dbo.collection("site").deleteOne(whereStr, function(err, obj) {
        if (err) throw err;
        console.log("文档删除成功");
        db.close();
    });
});
 */
//删除多条数据
/*
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("runoob");
    var whereStr = { type: "en" };  // 查询条件
    dbo.collection("site").deleteMany(whereStr, function(err, obj) {
        if (err) throw err;
        console.log(obj.result.n + " 条文档被删除");
        db.close();
    });
});
 */

//排序
//排序 使用 sort() 方法，该方法接受一个参数，规定是升序(1)还是降序(-1)。
//{ type: 1 }  // 按 type 字段升序
//{ type: -1 } // 按 type 字段降序
/*
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("runoob");
    var mysort = { type: 1 };
    dbo.collection("site").find().sort(mysort).toArray(function(err, result) {
        if (err) throw err;
        console.log(result);
        db.close();
    });
});
*/

//查询分页
//如果要设置指定的返回条数可以使用 limit() 方法，该方法只接受一个参数，指定了返回的条数。
//limit()：读取两条数据
/*
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("runoob");
    dbo.collection("site").find().limit(2).toArray(function(err, result) {
        if (err) throw err;
        console.log(result);
        db.close();
    });
});
*/
//如果要指定跳过的条数，可以使用 skip() 方法。
//skip(): 跳过前面两条数据，读取两条数据
/*
MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("runoob");
    dbo.collection("site").find().skip(2).limit(2).toArray(function(err, result) {
        if (err) throw err;
        console.log(result);
        db.close();
    });
});
*/

//连接操作
//mongoDB 不是一个关系型数据库，但我们可以使用 $lookup 来实现左连接。
//例如我们有两个集合数据分别为：
/*
集合1：orders

    [
    { _id: 1, product_id: 154, status: 1 }
    ]
集合2：products

    [
    { _id: 154, name: '笔记本电脑' },
        { _id: 155, name: '耳机' },
        { _id: 156, name: '台式电脑' }
    ]
*/
/*
$lookup 实现左连接

MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("runoob");
    dbo.collection('orders').aggregate([
        { $lookup:
                {
                    from: 'products',           # 右集合
    localField: 'product_id',   # 左集合 join字段
    foreignField: '_id',        # 右集合 join字段
    as: 'orderdetails'          # 新生成字段（类型array）
}
}
], function(err, res) {
        if (err) throw err;
        console.log(JSON.stringify(res));
        db.close();
    });
*/

//删除集合
//我们可以使用 drop() 方法来删除集合：
// drop()

/*
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("runoob");
        // 删除 test 集合
        dbo.collection("test").drop(function(err, delOK) {  // 执行成功 delOK 返回 true，否则返回 false
            if (err) throw err;
            if (delOK) console.log("集合已删除");
            db.close();
        });
    });
*/