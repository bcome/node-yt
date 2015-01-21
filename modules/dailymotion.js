'use strict';
var strftime;

strftime = require('strftime');

module.exports = function(bot, utils, https, sprintf, vsprintf) {
  var DAILYMOTION_API_URL, showInfo;
  DAILYMOTION_API_URL = 'https://api.dailymotion.com/video/%s?fields=duration,owner.screenname,title,rating,views_total,created_time';
  showInfo = function(to, videos) {
    return videos.forEach(function(v) {
      return https.get(sprintf(DAILYMOTION_API_URL, v), function(response) {
        var body;
        body = '';
        response.on('data', function(d) {
          return body += d;
        });
        response.on('end', function() {
          var parsed, video;
          parsed = JSON.parse(body);
          if (parsed.title === null || parsed.title === void 0) {
            return;
          }
          video = parsed;
          return bot.say(to, vsprintf("" + (utils.bold('Dailymotion »')) + " " + (utils.col('06', '%s')) + " (%s) · by %s on %s · " + (utils.col('03', '%s/5')) + " · %s views", [video.title, utils.toHHMMSS(video.duration), video['owner.screenname'], strftime('%F', new Date(video.created_time * 1000)), utils.commify_numbers(video.rating), utils.commify_numbers(video.views_total)]));
        });
        return response.on('error', function() {
          return bot.say(to, 'Error: Could not fetch video information.');
        });
      });
    });
  };
  return {
    showInfo: showInfo,
    API_URL: DAILYMOTION_API_URL
  };
};

//# sourceMappingURL=dailymotion.js.map
