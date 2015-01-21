'use strict';
var redis = require('redis');
var client = redis.createClient();

client.on('connect', function() {
    console.log('[REDIS] Cnnected.');
});

module.exports = (function() {
    var setItem,hasItem,getItem,delItem;
    setItem = function(vid, info) {
        console.log('[REDIS] Adding ' + vid + ' to cache.');
        client.set(vid, JSON.stringify(info));
        client.expire(vid, 3600);
    };
    hasItem = function(vid) {
        client.exists(vid, function(err, reply) {
            console.log('[REDIS] ' + JSON.stringify(reply));
            return reply === 1;
        });
    };
    getItem = function(vid) {
        console.log('[REDIS] Getting ' + vid + ' from cache.');
        client.get(vid, function(err, reply) {
            if (reply === null) {
                return null;
            }
            return JSON.parse(reply);
        });
    };
    delItem = function(vid) {
        console.log('[REDIS] Removing ' + vid + ' from cache.');
        client.del('frameworks', function(err, reply) {
            return reply ===1;
        });
    };
    return {
        setItem: setItem,
        hasItem: hasItem,
        getItem: getItem,
        delItem: delItem
    };
})();

