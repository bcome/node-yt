'use strict'
strftime = require('strftime')
#cache = require('../modules/cache')

module.exports = (bot, utils, http, sprintf, vsprintf) ->
  YOUTUBE_API_URL = 'http://gdata.youtube.com/feeds/api/videos/%s?v=2&alt=jsonc'
  showInfo = (to, videos) ->
    videos.forEach((v) ->
      http.get(sprintf(YOUTUBE_API_URL, v), (response) ->
          body = ''
          response.on 'data', (d) ->
            body += d
          response.on 'end', ->
            parsed = JSON.parse(body)
            return if parsed.data == null || parsed.data == undefined
            video = parsed.data
            bot.say(to,
              vsprintf("#{utils.bold('YouTube »')} #{utils.col('06', '%s')} (%s) · by %s on %s · #{utils.col('03', '☝%s')} #{utils.col('04', '☟%s')} · %s views", [
                video.title
                utils.toHHMMSS(video.duration) # seconds_to_time(video['duration']),
                video.uploader
                strftime('%F', new Date(Date.parse(video.uploaded)))
                utils.commify_numbers(video.likeCount)
                utils.commify_numbers((video.ratingCount - video.likeCount))
                utils.commify_numbers(video.viewCount)
              ])
            )
          response.on 'error', ->
            bot.say(to, 'Error: Could not fetch video information.')
      )
    )
  return { showInfo: showInfo, API_URL: YOUTUBE_API_URL }