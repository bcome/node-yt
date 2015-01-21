'use strict'
strftime = require('strftime')

module.exports = (bot, utils, http, sprintf, vsprintf) ->
  VIMEO_API_URL = 'http://vimeo.com/api/v2/video/%s.json'
  showInfo = (to, videos) ->
    videos.forEach((v) ->
      http.get(sprintf(VIMEO_API_URL, v), (response) ->
        body = ''
        response.on 'data', (d) ->
          body += d
        response.on 'end', ->
          parsed = JSON.parse(body)
          return if parsed[0].title == null || parsed[0].title == undefined
          video = parsed[0]
          bot.say(to,
            vsprintf("#{utils.bold('Vimeo »')} #{utils.col('06', '%s')} (%s) · by %s on %s · #{utils.col('03', '☝%s')} · %s views", [
              video.title
              utils.toHHMMSS(video.duration) # seconds_to_time(video['duration']),
              video.user_name
              strftime('%F', new Date(Date.parse(video.upload_date)))
              utils.commify_numbers(video.stats_number_of_likes)
              utils.commify_numbers(video.stats_number_of_plays)
            ])
          )
        response.on 'error', ->
          bot.say(to, 'Error: Could not fetch video information.')
      )
    )
  return { showInfo: showInfo, API_URL: VIMEO_API_URL }