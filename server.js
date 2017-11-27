var express = require('express');
var app = express();
var request = require('request');
var xml2js = require('xml2js');

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

var port = process.env.PORT || 8080;

var router = express.Router();

router.get('/', function(req, res) {
    res.json({ message: 'Welcome to Quoralis! Please check out http://quoralis.com' });
});

router.get('/posts', function(req, res) {
    request('https://medium.com/feed/quoralis', function(error, response, body) {
            if (!error) {
                xml2js.parseString(body, function(error, result) {
                    console.log('/posts called at ' + new Date());
                    res.json(result.rss.channel);
                });
            } else {
                res.error(error.message);
            }
        });
});

app.use('/', router);

app.listen(port);
console.log(`Listening on port ${port}`);