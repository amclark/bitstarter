var express = require('express');
var fs = require('fs');
var util = require('util');

var app = express.createServer(express.logger());

function send_file(res, file) {
    if (!file) return res.send('Not found', 404);
    return fs.exists(file, function(exists) {
        if (!exists) return res.send('Not found', 404);
        return fs.readFile(file, function(err, data) {
            if (err) throw err;
            return res.send(data.toString('utf8'));
        });
    });
}

app.get('/', function(req, res) {
    return send_file(res, 'index.html');
});

app.get('/:file', function(req, res) {
    return send_file(res, req.params.file);
});

app.get('/:dir/:file', function(req, res) {
    return send_file(res, req.params.dir + '/' + req.params.file);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
