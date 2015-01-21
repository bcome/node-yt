'use strict';
var http, parseString, test, _;

parseString = require('xml2js').parseString;

http = require('http');

_ = require('underscore');

var Wiki = (function () {
    var last_date, interval = 60;

    function Wiki() {
        this.interval = 60;
        this.last_date = 0;
    }

    Wiki.prototype.check = function () {
        var req = http.get('http://wiki.rizon.net/index.php?title=Special:RecentChanges&feed=atom', function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                parseString(data, function (err, result) {
                    var feed = result.feed;
                    var entries = _.pick(feed, 'entry');

                    var max_date = last_date;
                    var _fn = function (entry) {
                        var author, date, link, title;
                        date = Date.parse(_.pick(entry, 'updated').updated[0]);
                        if (date > last_date) {
                            max_date = _.max([max_date, date]);
                            title = _.pick(entry, 'title').title[0];
                            link = _.pick(entry, 'id').id[0];
                            author = _.pick(_.pick(entry, 'author').author[0], 'name').name[0];
                            console.log("" + title + " modified by " + author + " (" + link + ")");
                        }
                        last_date = max_date;
                    };
                    for (var _i = 0, _len = _ref.length; _i < _len; _i++) {
                        _fn(_ref[i]);
                    }
                });
            });
        });
        req.on('error', function (err) {
            console.error(err);
        });
        req.end();
    };

    return Wiki;
})();

var test = new Wiki;
test.check();