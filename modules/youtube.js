'use strict';
var strftime;

strftime = require('strftime');

module.exports = function(bot, utils, http, sprintf, vsprintf) {
  var YOUTUBE_API_URL, showInfo;
  YOUTUBE_API_URL = 'http://gdata.youtube.com/feeds/api/videos/%s?v=2&alt=jsonc';
  showInfo = function(to, videos) {
    return videos.forEach(function(v) {
      return http.get(sprintf(YOUTUBE_API_URL, v), function(response) {
        var body;
        body = '';
        response.on('data', function(d) {
          return body += d;
        });
        response.on('end', function() {
          var parsed, video;
          parsed = JSON.parse(body);
          if (parsed.data === null || parsed.data === void 0) {
            return;
          }
          video = parsed.data;
          return bot.say(to, vsprintf("" + (utils.bold('YouTube »')) + " " + (utils.col('06', '%s')) + " (%s) · by %s on %s · " + (utils.col('03', '☝%s')) + " " + (utils.col('04', '☟%s')) + " · %s views", [video.title, utils.toHHMMSS(video.duration), video.uploader, strftime('%F', new Date(Date.parse(video.uploaded))), utils.commify_numbers(video.likeCount), utils.commify_numbers(video.ratingCount - video.likeCount), utils.commify_numbers(video.viewCount)]));
        });
        return response.on('error', function() {
          return bot.say(to, 'Error: Could not fetch video information.');
        });
      });
    });
  };
  return {
    showInfo: showInfo,
    API_URL: YOUTUBE_API_URL
  };
};

//# sourceMappingURL=youtube.js.map
