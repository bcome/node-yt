'use strict'
strftime = require('strftime')

module.exports = (bot, utils, https, sprintf, vsprintf) ->
  DAILYMOTION_API_URL = 'https://api.dailymotion.com/video/%s?fields=duration,owner.screenname,title,rating,views_total,created_time'
  showInfo = (to, videos) ->
    videos.forEach((v) ->
      https.get(sprintf(DAILYMOTION_API_URL, v), (response) ->
          body = ''
          response.on 'data', (d) ->
            body += d
          response.on 'end', ->
            parsed = JSON.parse(body)
            return if parsed.title == null || parsed.title == undefined
            video = parsed
            bot.say(to,
              vsprintf("#{utils.bold('Dailymotion »')} #{utils.col('06', '%s')} (%s) · by %s on %s · #{utils.col('03', '%s/5')} · %s views", [
                video.title
                utils.toHHMMSS(video.duration) # seconds_to_time(video['duration']),
                video['owner.screenname']
                strftime('%F', new Date(video.created_time*1000))
                utils.commify_numbers(video.rating)
                utils.commify_numbers(video.views_total)
              ])
            )
          response.on 'error', ->
            bot.say(to, 'Error: Could not fetch video information.')
      )
    )
  return { showInfo: showInfo, API_URL: DAILYMOTION_API_URL }