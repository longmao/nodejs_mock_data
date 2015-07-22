var fileSystem = require('node-fs'),
    path = require('path'),
    urlParse = require('url').parse,
    fs = require('fs'),
    statuses = undefined;

var role = process.env.role || "am";
var system = process.env.system || "manage";
function colorLight(str) {
    return '\033[90m' + str + '\033[0m'
}

function colorRed(str) {
    return '\033[31m' + str + '\033[0m'
}

function colorYellow(str) {
    return '\033[33m' + str + '\033[0m'
}

var  ylog = function(str) {
        console.log(colorYellow(str.toString()))
    }

module.exports = {
    populateResponse: function (req, res, statusCode, resourcePath) {
        var bufstring = ''
        var referer = req.headers['referer'] || req.headers['referrer'] || req.headers['x-request-from']
        var urlParsed = urlParse(req.url, true);
        var testname = resourcePath
        fs.readFile(resourcePath, 'utf8', function(err, data) {
            if (err) return errorHandler(res)
            var apimock, get, post, onData

            function resData(data, statusCode) {
                var cb = urlParsed.query && urlParsed.query.callback

                function rd() {
                    var rt = JSON.stringify(data, null, '  ')
                    if (cb) rt = cb + '(' + rt + ')'
                    if (statusCode) {
                        if (typeof(statusCode) == 'string') statusCode = parseInt(statusCode) || 400
                        res.statusCode = statusCode
                    }
                    res.end(rt)
                }
                process.nextTick(rd)
            }
            function errorHandler(res){
            	res.send("json data file not found")
            }
            function matchData(mock, get, post) {
                var pathname = urlParse(req.url).pathname,
                    i, l, data

                function key(obj) {
                    return obj ? Object.keys(obj) : []
                }
                var getkey = key(get),
                    postkey = key(post)
                for (i = -1, l = mock.length; data = mock[++i];) {
                    if (pathname != data.url) continue
                    if (system !== data.system) continue 
                    if (role !== data.role) continue
                    var dgetkey = key(data.get)
                    if (dgetkey.length && (!getkey.length || !dgetkey.every(function(param) {
                            return get[param] == data.get[param]
                        }))) continue
                    var dpostkey = key(data.post)
                    console.log(dpostkey)
                    if (dpostkey.length && (!postkey.length || !dpostkey.every(function(param) {
                            return post[param] == data.post[param]
                        }))) continue
                    ylog('modified api: ' + req.url)
                    ylog('data file: ' + testname + '.json')
                    ylog(JSON.stringify({
                        get: data.get || {},
                        post: data.post || {}
                    }, null, '  '))
                    return resData(data.data, data.statusCode)
                }
                return errorHandler(res)
            }
            try {
                apimock = JSON.parse(data)
                if (!apimock || !apimock.length) apimock = false
            } catch (e) {
                console.error(e)
            }
            if (!apimock) {
                return errorHandler(res)
            } else {
                get = urlParsed.query || {}
                if (req.isGET) matchData(apimock, get, {})
                else {
                    req.isPostCache = true
                    req.setEncoding('utf8')
                    onData = function(data) {
                        bufstring += data
                    }
                    req.on('data', onData)
                    req.on('end', function(data) {
                        if (data) onData(data)
                        var post
                        try {
                            post = qs.parse(bufstring)
                        } catch (e) {}
                        matchData(apimock, get, post || {})
                    })
                    req.resume()
                }
            }
        })
        
    }
};