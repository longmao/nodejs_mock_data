//setup Dependencies
var express = require('express'),
    path = require('path'),
    cors = require('cors'),
    options = require('node-options'),
    fileSystem = require('node-fs'),
    bodyParser = require('body-parser'),
    statusCodes = require('./statusCodes');

var rootDir = path.resolve('.', 'mockdata').toLowerCase();

var opts = {
    "port": process.env.PORT | 1008,
    "verbose": false
};

options.parse(process.argv.slice(2), opts);

//Setup Express
var app = express();
app.use(bodyParser());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});



app.listen(opts.port);

app.all('/:resource/:id', function(req, res) {
    var id = req.params.id.toLocaleLowerCase();
    var resource = req.params.resource.toLocaleLowerCase();
    var resourceDir = "./mockdata/";
    var resourceFile = resource + "_" + id;
    var resourcePath = resourceDir + resourceFile + ".json";
    console.log('');
    console.log('id = %s', id);
    console.log('resource = %s', resourceFile);
    console.log('resource dir = %s', resourceDir);

    if (fileSystem.existsSync(resourceDir)) {
        try {
            statusCodes.populateResponse(res, "200", resourcePath);
        } catch (e) {
            res.status(200).sendFile(path.join(__dirname, resourceDir, 'empty.json'));
        }
    } else {
        res.status(404).send('The resource does not exist...');
        res.end();
    }
});

app.all('*', function(req, res) {
    res.status(404).send('Don\'t know what you\'re looking for...');
    res.end();
});

console.log('Listening on http://localhost:' + opts.port);
console.log('Root directory = \'' + rootDir + '\'');

function stringFormat(format /* arg1, arg2... */ ) {
    if (arguments.length === 0) {
        return undefined;
    }
    if (arguments.length === 1) {
        return format;
    }
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/\{\{|\}\}|\{(\d+)\}/g, function(m, n) {
        if (m === "{{") {
            return "{";
        }
        if (m === "}}") {
            return "}";
        }
        return args[n];
    });
}
