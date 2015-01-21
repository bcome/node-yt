'use strict'
#SpotifyWebApi = require 'spotify-web-api-node'
#
#spotifyApi = new SpotifyWebApi({
#  clientId: '135a4eca73164d9d8d9201318b5998e7'
#  clientSecret: 'b840ed7ea0da4c9fa6215a7d9935724b'
#
#})
module.exports = (bot, utils, http, sprintf, vsprintf) ->
  SPOTIFY_TRACK_API_URL = 'https://api.spotify.com/v1/tracks/%s'
  SPOTIFY_ALBUM_API_URL = 'https://api.spotify.com/v1/albums/%s'
  trackInfo = (to, videos) ->
    videos.forEach((v) ->
      http.get(sprintf(SPOTIFY_TRACK_API_URL, v), (response) ->
        body = ''
        response.on 'data', (d) ->
          body += d
        response.on 'end', ->
          parsed = JSON.parse(body)
          return if parsed.uri == null || parsed.uri == undefined
          video = parsed
          bot.say(to,
            vsprintf("#{utils.bold('Spotify »')} #{utils.col('06', '%s')} (%s) · by %s", [
              video.name
              utils.toHHMMSS(Math.floor(video['duration_ms']/1000)) # seconds_to_time(video['duration']),
              video['artists'][0].name
            ])
          )
        response.on 'error', ->
          bot.say(to, 'Error: Could not fetch video information.')
      )
    )
  albumInfo = (to, videos) ->
    videos.forEach((v) ->
      http.get(sprintf(SPOTIFY_ALBUM_API_URL, v), (response) ->
        body = ''
        response.on 'data', (d) ->
          body += d
        response.on 'end', ->
          parsed = JSON.parse(body)
          return if parsed.uri == null || parsed.uri == undefined
          video = parsed
          bot.say(to,
            vsprintf("#{utils.bold('Spotify »')} #{utils.col('06', '%s')} (%s tracks) · by %s", [
              video.name
              video.tracks.total
              video['artists'][0].name
            ])
          )
        response.on 'error', ->
          bot.say(to, 'Error: Could not fetch video information.')
      )
    )
  return {
    showTrackInfo: trackInfo
    showAlbumInfo: albumInfo
    TRACK_API_URL: SPOTIFY_TRACK_API_URL
    ALBUM_API_URL: SPOTIFY_ALBUM_API_URL
  }