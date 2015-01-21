'use strict';
var strftime;

strftime = require('strftime');

module.exports = function(bot, utils, http, sprintf, vsprintf) {
  var VIMEO_API_URL, showInfo;
  VIMEO_API_URL = 'http://vimeo.com/api/v2/video/%s.json';
  showInfo = function(to, videos) {
    return videos.forEach(function(v) {
      return http.get(sprintf(VIMEO_API_URL, v), function(response) {
        var body;
        body = '';
        response.on('data', function(d) {
          return body += d;
        });
        response.on('end', function() {
          var parsed, video;
          parsed = JSON.parse(body);
          if (parsed[0].title === null || parsed[0].title === void 0) {
            return;
          }
          video = parsed[0];
          return bot.say(to, vsprintf("" + (utils.bold('Vimeo »')) + " " + (utils.col('06', '%s')) + " (%s) · by %s on %s · " + (utils.col('03', '☝%s')) + " · %s views", [video.title, utils.toHHMMSS(video.duration), video.user_name, strftime('%F', new Date(Date.parse(video.upload_date))), utils.commify_numbers(video.stats_number_of_likes), utils.commify_numbers(video.stats_number_of_plays)]));
        });
        return response.on('error', function() {
          return bot.say(to, 'Error: Could not fetch video information.');
        });
      });
    });
  };
  return {
    showInfo: showInfo,
    API_URL: VIMEO_API_URL
  };
};

//# sourceMappingURL=vimeo.js.map
