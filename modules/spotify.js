'use strict';
module.exports = function(bot, utils, http, sprintf, vsprintf) {
  var SPOTIFY_ALBUM_API_URL, SPOTIFY_TRACK_API_URL, albumInfo, trackInfo;
  SPOTIFY_TRACK_API_URL = 'https://api.spotify.com/v1/tracks/%s';
  SPOTIFY_ALBUM_API_URL = 'https://api.spotify.com/v1/albums/%s';
  trackInfo = function(to, videos) {
    return videos.forEach(function(v) {
      return http.get(sprintf(SPOTIFY_TRACK_API_URL, v), function(response) {
        var body;
        body = '';
        response.on('data', function(d) {
          return body += d;
        });
        response.on('end', function() {
          var parsed, video;
          parsed = JSON.parse(body);
          if (parsed.uri === null || parsed.uri === void 0) {
            return;
          }
          video = parsed;
          return bot.say(to, vsprintf("" + (utils.bold('Spotify »')) + " " + (utils.col('06', '%s')) + " (%s) · by %s", [video.name, utils.toHHMMSS(Math.floor(video['duration_ms'] / 1000)), video['artists'][0].name]));
        });
        return response.on('error', function() {
          return bot.say(to, 'Error: Could not fetch video information.');
        });
      });
    });
  };
  albumInfo = function(to, videos) {
    return videos.forEach(function(v) {
      return http.get(sprintf(SPOTIFY_ALBUM_API_URL, v), function(response) {
        var body;
        body = '';
        response.on('data', function(d) {
          return body += d;
        });
        response.on('end', function() {
          var parsed, video;
          parsed = JSON.parse(body);
          if (parsed.uri === null || parsed.uri === void 0) {
            return;
          }
          video = parsed;
          return bot.say(to, vsprintf("" + (utils.bold('Spotify »')) + " " + (utils.col('06', '%s')) + " (%s tracks) · by %s", [video.name, video.tracks.total, video['artists'][0].name]));
        });
        return response.on('error', function() {
          return bot.say(to, 'Error: Could not fetch video information.');
        });
      });
    });
  };
  return {
    showTrackInfo: trackInfo,
    showAlbumInfo: albumInfo,
    TRACK_API_URL: SPOTIFY_TRACK_API_URL,
    ALBUM_API_URL: SPOTIFY_ALBUM_API_URL
  };
};

//# sourceMappingURL=spotify.js.map
