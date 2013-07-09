var express = require('express');
var fs = require('fs');

var app = express.createServer(express.logger());

app.get('/', function(req, res) {
  var buf = fs.readFileSync('index.html');
  res.send(buf.toString('utf8'));
});

app.get('/js/:file', function(req, res) {
    var file = 'js/' + req.params.file;
    if (!req.params.file || !fs.existsSync(file)) {
        res.send(404, 'Not found');
    } else {
        var buf = fs.readFileSync(file);
        res.send(buf.toString('utf8'));
    }
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
