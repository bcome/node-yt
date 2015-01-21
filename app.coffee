'use strict'
utils = require('./modules/utils')(bot)
irc = require('irc')
http = require('http')
https = require('https')
fs = require('fs')
sprintf = require('sprintf-js').sprintf
vsprintf = require('sprintf-js').vsprintf

_ = require('underscore')

db = require('./modules/database')

YOUTUBE_VIDEO_REGEXP = /https?:\/\/(?:[a-zA-Z]{2,3}\.)?(?:youtube\.com\/watch)(?:\?(?:[\w=-]+&(?:amp;)?)*v=([\w-]+)(?:&(?:amp;)?[\w=-]+)*)?(?:#[!]?(?:(?:(?:[\w=-]+&(?:amp;)?)*(?:v=([\w-]+))(?:&(?:amp;)?[\w=-]+)*)|(?:[\w=&-]+)))?[^\w-]?|https?:\/\/(?:[a-zA-Z]{2,3}\.)?(?:youtu\.be\/)([\w-]+)/ig
DAILYMOTION_VIDEO_REGEXP = /https?:\/\/(?:[a-zA-Z]{2,3}\.)?(?:dailymotion\.com\/video\/)([^_]+).*|https?:\/\/(?:[a-zA-Z]{2,3}\.)?(?:dai\.ly\/)(?:[^_]+).*/ig
VIMEO_VIDEO_REGEXP = /https?:\/\/(?:player\.)?vimeo.com\/(?:m|video\/)?([0-9]+)/ig
SPOTIFY_TRACK_REGEXP = /spotify:track:([a-zA-Z0-9]+)/ig
SPOTIFY_ALBUM_REGEXP = /spotify:album:([a-zA-Z0-9]+)/ig


config = require('./config')()
bot = new irc.Client(config.server, config.nick, config)

bot.addListener 'error', (message) ->
  bot.say config.debugChan, sprintf(utils.bold('[ERROR]') + ' %s: %s', message.command, message.args.join ' ')
  bot.emit('join_error', message) if message.args[1] == config.join_info.channel

bot.addListener 'raw', (message) ->
#  console.log '[RAW] ' + message.args.join ' '
  return unless config.registered
  if message.command == 'ERROR'
    if message.args[0].contains 'Killed'
      console.log 'Got killed: ' + message.args.join ' '
  return unless message.args[2]?

  if message.args[2].startsWith 'Cannot join channel'
    bot.say config.debugChan, sprintf(utils.bold('[ERROR]') + ' %s: %s', message.command, message.args.join ' ')
    bot.emit('join_error', message) if message.args[1] == config.join_info.channel
  if message.args[2].startsWith 'You cannot use control codes on this channel'
    bot.say message.args[1]

bot.addListener 'notice', (from, to, text) ->
  return unless config.registered
  return bot.say(config.debugChan, sprintf(utils.bold('[NOTICE]') + ' <%s> %s', from, text))

bot.addListener 'message', (from, to, message) ->
  console.log '%s: <%s> %s', to, from, message
  return unless config.registered
  return if from == 'Internets' || from == 'Quotes' || from == 'ChanStat'
  return bot.say(config.debugChan, sprintf(utils.bold('[PRIVMSG]') + ' <%s> %s', from, message)) unless to.startsWith '#'
  videos = []
  if message.match(YOUTUBE_VIDEO_REGEXP) != null
    channel_enabled(to).then((enabled) ->
      return unless enabled
      while ((match = YOUTUBE_VIDEO_REGEXP.exec(message)) != null)
        match = _.filter(_.flatten(match), (item) -> item?)
        videos.push match[1]
      YT.showInfo(to, videos)
    )

  if message.match(DAILYMOTION_VIDEO_REGEXP) != null
    channel_enabled(to).then((enabled) ->
      return unless enabled
      while ((match = DAILYMOTION_VIDEO_REGEXP.exec(message)) != null)
        match = _.filter(_.flatten(match), (item) -> item?)
        videos.push match[1]
      DM.showInfo(to, videos)
    )
  if message.match(VIMEO_VIDEO_REGEXP) != null
    channel_enabled(to).then((enabled) ->
      return unless enabled
      while ((match = VIMEO_VIDEO_REGEXP.exec(message)) != null)
        match = _.filter(_.flatten(match), (item) -> item?)
        videos.push match[1]
      VM.showInfo(to, videos)
    )
  if message.match(SPOTIFY_TRACK_REGEXP) != null
    channel_enabled(to).then((enabled) ->
      return unless enabled
      while ((match = SPOTIFY_TRACK_REGEXP.exec(message)) != null)
        match = _.filter(_.flatten(match), (item) -> item?)
        videos.push match[1]
      SP.showTrackInfo(to, videos)
    )
  if message.match(SPOTIFY_ALBUM_REGEXP) != null
    channel_enabled(to).then((enabled) ->
      return unless enabled
      while ((match = SPOTIFY_ALBUM_REGEXP.exec(message)) != null)
        match = _.filter(_.flatten(match), (item) -> item?)
        videos.push match[1]
      SP.showAlbumInfo(to, videos)
    )



  if message.startsWith config.prefix + 'enable'
    chan = if message.split(' ')[1]? then message.split(' ')[1] else to
    chan = to if config.admins.indexOf(from) == -1
    db.Chan.find({where: {name: chan.toLowerCase()}}).then((channel) ->
      channel.active = true
      channel.save().then(->
        bot.notice(from, sprintf('Enabled %s', channel.name))
      ,(err) ->
        bot.notice(from, sprintf('Could not enable that channel: %s', err))
      )
    )

  if message.startsWith config.prefix + 'disable'
    chan = if message.split(' ')[1]? then message.split(' ')[1] else to
    chan = to if config.admins.indexOf(from) == -1
    db.Chan.find({where: {name: chan.toLowerCase()}}).then((channel) ->
      channel.active = false
      channel.save().then(->
        bot.notice(from, sprintf('Disabled %s', channel.name))
      ,(err) ->
        bot.notice(from, sprintf('Could not disable that channel: %s', err))
      )
    )

  if message.startsWith config.prefix + 'dance'
    setTimeout(->
      bot.say(to, "\u0001ACTION dances: :D\\-<\u0001")
    , 1000)
    setTimeout(->
      bot.say(to, "\u0001ACTION dances: :D|-<\u0001")
    , 2000)
    setTimeout(->
      bot.say(to, "\u0001ACTION dances: :D/-<\u0001")
    , 3000)
    setTimeout(->
      bot.say(to, "\u0001ACTION dances: :D|-<\u0001")
    , 4000)

  if message.startsWith config.prefix + 'tld'
    tld = message.split(' ')[1]
    return unless TLD.tlds[tld]?
    bot.say to, tld + ' => ' + TLD.tlds[tld]

  if message.startsWith config.prefix + 'since'
    debugString = message.split(' ')
    debugString.splice(0,1)
    date = debugString.join ' '
    bot.say to, utils.since(date).replace(/\-/g,'') + ' ' + date

  if config.admins.indexOf(from) != -1
    if message.startsWith config.prefix + 'part'
      chan = if message.split(' ')[1]? then message.split(' ')[1] else to
      part_chan(chan)

    if message.startsWith config.prefix + 'join'
      split = message.split(' ')
      return unless split[1]?
      console.log 'Joining ' + split[1].toLowerCase()
      db.Chan.findOrCreate({where: {name: split[1].toLowerCase()}}).then((channel, created) ->
        channel = channel[0]
        return if channel.blocked
        bot.join channel.name
        return bot.notice(from, sprintf('Joined new channel %s', channel.name)) if created
        return bot.notice(from, sprintf('Joined channel %s', channel.name)) unless created
      )

    if message.startsWith config.prefix + 'block'
      chan = if message.split(' ')[1]? then message.split(' ')[1] else to
      db.Chan.findOrCreate({where: {name: chan.toLowerCase()}}).then((channel) ->
        channel = channel[0]
        channel.blocked = true
        channel.save().then(->
          force = message.split(' ')[2]
          bot.notice(from, sprintf('Blocked %s', channel.name))
          if force? && force == 'force'
            bot.part chan.toLowerCase()
        ,(err) ->
          bot.notice(from, sprintf('Could not block that channel: %s', err))
        )
      )

    if message.startsWith config.prefix + 'unblock'
      chan = if message.split(' ')[1]? then message.split(' ')[1] else to
      db.Chan.find({where: {name: chan.toLowerCase()}}).then((channel) ->
        channel.blocked = false
        channel.save().then(->
          bot.notice(from, sprintf('Unblocked %s', channel.name))
        ,(err) ->
          bot.notice(from, sprintf('Could not unblock that channel: %s', err))
        )
      )

    if message.startsWith config.prefix + 'debug'
      debugString = message.split(' ')
      debugString.splice(0,1)
      try
        output = eval debugString.join ' '
        bot.say to, output
      catch e
        bot.say to, 'Error: ' + e.message

    if message.startsWith config.prefix + 'quit'
      debugString = message.split(' ')
      debugString.splice(0,1)
      debugString = ['Quit', 'command', 'used', 'by', from] if debugString.length < 1
      return bot.disconnect debugString.join ' '

    if message.startsWith config.prefix + 'say'
      debugString = message.split(' ')
      target = debugString[1].toLowerCase()
      debugString.splice(1,1)
      return bot.say target, debugString.join ' '

    if message.startsWith config.prefix + 'getsetting'
      setting_name = message.split(' ')[1]
      db.Setting.find({where: {name: setting_name}}).then((setting) ->
        return bot.say to, setting_name + ' = ' + setting
      )
    if message.startsWith config.prefix + 'setsetting'
      split = message.split(' ')
      setting_name = split[1]
      setting_value =split[2]
      db.Setting.findOrCreate({where: {name: setting_name}}).then((setting) ->
        setting = setting[0]
        channel.value = setting_value
        setting.save().then(->
          force = message.split(' ')[2]
          bot.notice(from, sprintf('Set %s to %s', setting_name, setting_value))
        ,(err) ->
          bot.notice(from, sprintf('Could not block that channel: %s', err))
        )
      )

bot.addListener 'invite', (channel, from) ->
  channel = channel.toLowerCase()
  return if channel.startsWith '#help'
  db.Setting.find({where: {name: 'max_chans'}}).then((max_chans) ->
    if _.size(bot.chans) + 1 > max_chans
      bot.say(config.debugChan, utils.bold('[INVITE]') + ' Got invited to ' + utils.bold(channel) + ' by ' + utils.bold(from) + ', but my channel list is full: ' + utils.bold(_.size(bot.chans)) + '/' + utils.bold(max_chans) + ' channels joined.') if chan.blocked
      return bot.notice(from, "My channel list is currently full, so I'm unable to join your channel at this time.")
  )
  db.Chan.findOrCreate({where: {name: channel.toLowerCase()}}).then((chan) ->
    chan = chan[0]
    return bot.say(config.debugChan, utils.bold('[INVITE]') + ' Got invited to ' + utils.bold(channel) + ' by ' + utils.bold(from) + ', but channel is blocked.') if chan.blocked
    bot.say(config.debugChan, utils.bold('[INVITE]') + ' Got invited to ' + utils.bold(channel) + ' by ' + utils.bold(from) + ', joining.')
    config.join_info = {channel: channel.toLowerCase(), invitee: from}
    bot.join channel, ->
      bot.say channel, "Hello, I am #{utils.bold('YT-info')}, I am an URL information bot. I was invited here by #{utils.bold(from)}. You can enable or disable my URL information by typing #{utils.bold(config.prefix + 'enable')} or #{utils.bold(config.prefix + 'disable')}. For more information PM #{utils.bold('Dwarf')}."
      config.join_info = {}
  )

bot.addListener 'join_error', (message) ->
  bot.notice config.join_info.invitee, 'I was unable to join your channel: ' + message.args[2]
  part_chan(config.join_info.channel, false)
  config.join_info = {}

bot.addListener 'kick', (channel, who, bywho, reason) ->
  return unless who == bot.nick
  db.Chan.find({where: {name: channel.toLowerCase()}}).then((chan) ->
    extra = ''
    unless chan.blocked
      chan.destroy()
      extra = ', removing.'
    bot.say config.debugChan, utils.bold('[KICK]') + ' Got kicked from ' + utils.bold(channel) + ' by ' + utils.bold(bywho) + ' (' + reason + ')'+extra
  )

bot.addListener 'ctcp-version', (from) ->
  bot.ctcp(from, 'notice', 'VERSION ' + config.realName)


bot.addListener 'motd', ->
  config.registered = true
  bot.say 'nickserv', 'id ' + config.nsPass if config.nsPass.length > 0
  bot.join config.debugChan, ->
    update_chans()
    bot.send('MODE', bot.nick, '+p')
    bot.say config.debugChan, 'Joining ' + utils.bold(config.myChannels.length) + ' channels.'

    setTimeout(->
      chans = (c.name.toLowerCase() for c in config.myChannels)
      join_all_chans(chans)
      return
    ,3000)
    return
  return

YT = require('./modules/youtube')(bot, utils, http, sprintf, vsprintf)
DM = require('./modules/dailymotion')(bot, utils, https, sprintf, vsprintf)
VM = require('./modules/vimeo')(bot, utils, http, sprintf, vsprintf)
SP = require('./modules/spotify')(bot, utils, https, sprintf, vsprintf)
TLD = require('./modules/tld')(bot, utils)

String::startsWith = (needle) -> @lastIndexOf(needle, 0) == 0
String::contains = (needle) -> @lastIndexOf(needle) != -1

update_chans = ->
  db.fetch_channels
  config.myChannels = db.channels

channel_enabled = (channel) ->
  db.Chan.find({where: {name: channel.toLowerCase()}}).then((chan) ->
    chan.active && !chan.blocked
  )

join_all_chans = (channels) ->
  temparray = []
  chunk = 10
  i = 0
  j = channels.length

  while i < j
    temparray = channels.slice(i, i + chunk)
    i += chunk
    bot.join temparray.join(',')
  return

part_chan = (chan, part = true) ->
  db.Chan.find({where: {name: chan.toLowerCase()}}).then((channel) ->
    channel.destroy() unless channel.blocked
    bot.part chan.toLowerCase() if part
  )

Array::where = (query) ->
  return [] if typeof query isnt "object"
  hit = Object.keys(query).length
  @filter (item) ->
    match = 0
    for key, val of query
      match += 1 if item[key] is val
    if match is hit then true else false