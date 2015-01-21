'use strict'
numeral = require('numeral')

module.exports = (bot) ->
  toHHMMSS = (num) ->
    sec_num = parseInt(num, 10) # don't forget the second param
    hours = Math.floor(sec_num / 3600)
    minutes = Math.floor((sec_num - (hours * 3600)) / 60)
    seconds = sec_num - (hours * 3600) - (minutes * 60)

    hours = "0" + hours if (hours < 10)
    minutes = "0" + minutes if (minutes < 10)
    seconds = "0" + seconds if (seconds < 10)
    time = ''
    time += "#{hours}:" if hours > 0
    time += "#{minutes}:#{seconds}"
    return time

  since = (date) ->
    date = Date.parse(date)
    intervals = [['day', 1], ['hour', 24], ['minute', 60], ['second', 60]]
    elapsed = (new Date).getTime() - date

    elapsed = elapsed / 1000 / 3600 / 24


    tense = if elapsed > 0 then 'since' else 'until'
    interval = 1.0
    parts = intervals.map((item) ->
      interval /= item[1]
      number = Math.floor(elapsed/interval)
      elapsed = elapsed % interval
      "#{number} #{item[0]}#{'s' unless number == 1}"
    )
    "#{parts.join(', ')} #{tense}"

  commify_numbers = (num) -> return numeral(num).format '0,0'
  col = (color, text) -> return "\u0003#{color}#{text}\u0003"
  bold = (text) -> return "\u0002#{text}\u0002"
  say = (chan, text) ->
    return if bot == undefined
    return if bot.chans == undefined
    return bot.say(chan, strip_color(text)) if bot.chans[chan] == undefined
    return bot.say(chan, strip_color(text)) if bot.chans[chan].mode == undefined
    if bot.chans[chan].mode.contains 'c'
      bot.say(chan, strip_color(text))
    else
      bot.say chan, text

  strip_color = (text) ->
    while /[\x02\x1F\x0F\x16]|\x03(\d\d?(,\d\d?)?)?/gi.exec(text) != null
      text = text.replace(/[\x02\x1F\x0F\x16]|\x03(\d\d?(,\d\d?)?)?/gi, '')
    return text

  return {
    toHHMMSS: toHHMMSS
    since: since
    col: col
    bold: bold
    commify_numbers: commify_numbers
    say: say
    strip_color: strip_color
  }