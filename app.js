'use strict';
var DAILYMOTION_VIDEO_REGEXP, DM, SP, SPOTIFY_ALBUM_REGEXP, SPOTIFY_TRACK_REGEXP, TLD, VIMEO_VIDEO_REGEXP, VM, YOUTUBE_VIDEO_REGEXP, YT, bot, channel_enabled, config, db, fs, http, https, irc, join_all_chans, part_chan, sprintf, update_chans, utils, vsprintf, _;

utils = require('./modules/utils')(bot);

irc = require('irc');

http = require('http');

https = require('https');

fs = require('fs');

sprintf = require('sprintf-js').sprintf;

vsprintf = require('sprintf-js').vsprintf;

_ = require('underscore');

db = require('./modules/database');

YOUTUBE_VIDEO_REGEXP = /https?:\/\/(?:[a-zA-Z]{2,3}\.)?(?:youtube\.com\/watch)(?:\?(?:[\w=-]+&(?:amp;)?)*v=([\w-]+)(?:&(?:amp;)?[\w=-]+)*)?(?:#[!]?(?:(?:(?:[\w=-]+&(?:amp;)?)*(?:v=([\w-]+))(?:&(?:amp;)?[\w=-]+)*)|(?:[\w=&-]+)))?[^\w-]?|https?:\/\/(?:[a-zA-Z]{2,3}\.)?(?:youtu\.be\/)([\w-]+)/ig;

DAILYMOTION_VIDEO_REGEXP = /https?:\/\/(?:[a-zA-Z]{2,3}\.)?(?:dailymotion\.com\/video\/)([^_]+).*|https?:\/\/(?:[a-zA-Z]{2,3}\.)?(?:dai\.ly\/)(?:[^_]+).*/ig;

VIMEO_VIDEO_REGEXP = /https?:\/\/(?:player\.)?vimeo.com\/(?:m|video\/)?([0-9]+)/ig;

SPOTIFY_TRACK_REGEXP = /spotify:track:([a-zA-Z0-9]+)/ig;

SPOTIFY_ALBUM_REGEXP = /spotify:album:([a-zA-Z0-9]+)/ig;

config = require('./config')();

bot = new irc.Client(config.server, config.nick, config);

bot.addListener('error', function(message) {
  bot.say(config.debugChan, sprintf(utils.bold('[ERROR]') + ' %s: %s', message.command, message.args.join(' ')));
  if (message.args[1] === config.join_info.channel) {
    return bot.emit('join_error', message);
  }
});

bot.addListener('raw', function(message) {
  if (!config.registered) {
    return;
  }
  if (message.command === 'ERROR') {
    if (message.args[0].contains('Killed')) {
      console.log('Got killed: ' + message.args.join(' '));
    }
  }
  if (message.args[2] == null) {
    return;
  }
  if (message.args[2].startsWith('Cannot join channel')) {
    bot.say(config.debugChan, sprintf(utils.bold('[ERROR]') + ' %s: %s', message.command, message.args.join(' ')));
    if (message.args[1] === config.join_info.channel) {
      bot.emit('join_error', message);
    }
  }
  if (message.args[2].startsWith('You cannot use control codes on this channel')) {
    return bot.say(message.args[1]);
  }
});

bot.addListener('notice', function(from, to, text) {
  if (!config.registered) {
    return;
  }
  return bot.say(config.debugChan, sprintf(utils.bold('[NOTICE]') + ' <%s> %s', from, text));
});

bot.addListener('message', function(from, to, message) {
  var chan, date, debugString, e, output, setting_name, setting_value, split, target, tld, videos;
  console.log('%s: <%s> %s', to, from, message);
  if (!config.registered) {
    return;
  }
  if (from === 'Internets' || from === 'Quotes' || from === 'ChanStat') {
    return;
  }
  if (!to.startsWith('#')) {
    return bot.say(config.debugChan, sprintf(utils.bold('[PRIVMSG]') + ' <%s> %s', from, message));
  }
  videos = [];
  if (message.match(YOUTUBE_VIDEO_REGEXP) !== null) {
    channel_enabled(to).then(function(enabled) {
      var match;
      if (!enabled) {
        return;
      }
      while ((match = YOUTUBE_VIDEO_REGEXP.exec(message)) !== null) {
        match = _.filter(_.flatten(match), function(item) {
          return item != null;
        });
        videos.push(match[1]);
      }
      return YT.showInfo(to, videos);
    });
  }
  if (message.match(DAILYMOTION_VIDEO_REGEXP) !== null) {
    channel_enabled(to).then(function(enabled) {
      var match;
      if (!enabled) {
        return;
      }
      while ((match = DAILYMOTION_VIDEO_REGEXP.exec(message)) !== null) {
        match = _.filter(_.flatten(match), function(item) {
          return item != null;
        });
        videos.push(match[1]);
      }
      return DM.showInfo(to, videos);
    });
  }
  if (message.match(VIMEO_VIDEO_REGEXP) !== null) {
    channel_enabled(to).then(function(enabled) {
      var match;
      if (!enabled) {
        return;
      }
      while ((match = VIMEO_VIDEO_REGEXP.exec(message)) !== null) {
        match = _.filter(_.flatten(match), function(item) {
          return item != null;
        });
        videos.push(match[1]);
      }
      return VM.showInfo(to, videos);
    });
  }
  if (message.match(SPOTIFY_TRACK_REGEXP) !== null) {
    channel_enabled(to).then(function(enabled) {
      var match;
      if (!enabled) {
        return;
      }
      while ((match = SPOTIFY_TRACK_REGEXP.exec(message)) !== null) {
        match = _.filter(_.flatten(match), function(item) {
          return item != null;
        });
        videos.push(match[1]);
      }
      return SP.showTrackInfo(to, videos);
    });
  }
  if (message.match(SPOTIFY_ALBUM_REGEXP) !== null) {
    channel_enabled(to).then(function(enabled) {
      var match;
      if (!enabled) {
        return;
      }
      while ((match = SPOTIFY_ALBUM_REGEXP.exec(message)) !== null) {
        match = _.filter(_.flatten(match), function(item) {
          return item != null;
        });
        videos.push(match[1]);
      }
      return SP.showAlbumInfo(to, videos);
    });
  }
  if (message.startsWith(config.prefix + 'enable')) {
    chan = message.split(' ')[1] != null ? message.split(' ')[1] : to;
    if (config.admins.indexOf(from) === -1) {
      chan = to;
    }
    db.Chan.find({
      where: {
        name: chan.toLowerCase()
      }
    }).then(function(channel) {
      channel.active = true;
      return channel.save().then(function() {
        return bot.notice(from, sprintf('Enabled %s', channel.name));
      }, function(err) {
        return bot.notice(from, sprintf('Could not enable that channel: %s', err));
      });
    });
  }
  if (message.startsWith(config.prefix + 'disable')) {
    chan = message.split(' ')[1] != null ? message.split(' ')[1] : to;
    if (config.admins.indexOf(from) === -1) {
      chan = to;
    }
    db.Chan.find({
      where: {
        name: chan.toLowerCase()
      }
    }).then(function(channel) {
      channel.active = false;
      return channel.save().then(function() {
        return bot.notice(from, sprintf('Disabled %s', channel.name));
      }, function(err) {
        return bot.notice(from, sprintf('Could not disable that channel: %s', err));
      });
    });
  }
  if (message.startsWith(config.prefix + 'dance')) {
    setTimeout(function() {
      return bot.say(to, "\u0001ACTION dances: :D\\-<\u0001");
    }, 1000);
    setTimeout(function() {
      return bot.say(to, "\u0001ACTION dances: :D|-<\u0001");
    }, 2000);
    setTimeout(function() {
      return bot.say(to, "\u0001ACTION dances: :D/-<\u0001");
    }, 3000);
    setTimeout(function() {
      return bot.say(to, "\u0001ACTION dances: :D|-<\u0001");
    }, 4000);
  }
  if (message.startsWith(config.prefix + 'tld')) {
    tld = message.split(' ')[1];
    if (TLD.tlds[tld] == null) {
      return;
    }
    bot.say(to, tld + ' => ' + TLD.tlds[tld]);
  }
  if (message.startsWith(config.prefix + 'since')) {
    debugString = message.split(' ');
    debugString.splice(0, 1);
    date = debugString.join(' ');
    bot.say(to, utils.since(date).replace(/\-/g, '') + ' ' + date);
  }
  if (config.admins.indexOf(from) !== -1) {
    if (message.startsWith(config.prefix + 'part')) {
      chan = message.split(' ')[1] != null ? message.split(' ')[1] : to;
      part_chan(chan);
    }
    if (message.startsWith(config.prefix + 'join')) {
      split = message.split(' ');
      if (split[1] == null) {
        return;
      }
      console.log('Joining ' + split[1].toLowerCase());
      db.Chan.findOrCreate({
        where: {
          name: split[1].toLowerCase()
        }
      }).then(function(channel, created) {
        channel = channel[0];
        if (channel.blocked) {
          return;
        }
        bot.join(channel.name);
        if (created) {
          return bot.notice(from, sprintf('Joined new channel %s', channel.name));
        }
        if (!created) {
          return bot.notice(from, sprintf('Joined channel %s', channel.name));
        }
      });
    }
    if (message.startsWith(config.prefix + 'block')) {
      chan = message.split(' ')[1] != null ? message.split(' ')[1] : to;
      db.Chan.findOrCreate({
        where: {
          name: chan.toLowerCase()
        }
      }).then(function(channel) {
        channel = channel[0];
        channel.blocked = true;
        return channel.save().then(function() {
          var force;
          force = message.split(' ')[2];
          bot.notice(from, sprintf('Blocked %s', channel.name));
          if ((force != null) && force === 'force') {
            return bot.part(chan.toLowerCase());
          }
        }, function(err) {
          return bot.notice(from, sprintf('Could not block that channel: %s', err));
        });
      });
    }
    if (message.startsWith(config.prefix + 'unblock')) {
      chan = message.split(' ')[1] != null ? message.split(' ')[1] : to;
      db.Chan.find({
        where: {
          name: chan.toLowerCase()
        }
      }).then(function(channel) {
        channel.blocked = false;
        return channel.save().then(function() {
          return bot.notice(from, sprintf('Unblocked %s', channel.name));
        }, function(err) {
          return bot.notice(from, sprintf('Could not unblock that channel: %s', err));
        });
      });
    }
    if (message.startsWith(config.prefix + 'debug')) {
      debugString = message.split(' ');
      debugString.splice(0, 1);
      try {
        output = eval(debugString.join(' '));
        bot.say(to, output);
      } catch (_error) {
        e = _error;
        bot.say(to, 'Error: ' + e.message);
      }
    }
    if (message.startsWith(config.prefix + 'quit')) {
      debugString = message.split(' ');
      debugString.splice(0, 1);
      if (debugString.length < 1) {
        debugString = ['Quit', 'command', 'used', 'by', from];
      }
      return bot.disconnect(debugString.join(' '));
    }
    if (message.startsWith(config.prefix + 'say')) {
      debugString = message.split(' ');
      target = debugString[1].toLowerCase();
      debugString.splice(1, 1);
      return bot.say(target, debugString.join(' '));
    }
    if (message.startsWith(config.prefix + 'getsetting')) {
      setting_name = message.split(' ')[1];
      db.Setting.find({
        where: {
          name: setting_name
        }
      }).then(function(setting) {
        return bot.say(to, setting_name + ' = ' + setting);
      });
    }
    if (message.startsWith(config.prefix + 'setsetting')) {
      split = message.split(' ');
      setting_name = split[1];
      setting_value = split[2];
      return db.Setting.findOrCreate({
        where: {
          name: setting_name
        }
      }).then(function(setting) {
        setting = setting[0];
        channel.value = setting_value;
        return setting.save().then(function() {
          var force;
          force = message.split(' ')[2];
          return bot.notice(from, sprintf('Set %s to %s', setting_name, setting_value));
        }, function(err) {
          return bot.notice(from, sprintf('Could not block that channel: %s', err));
        });
      });
    }
  }
});

bot.addListener('invite', function(channel, from) {
  channel = channel.toLowerCase();
  if (channel.startsWith('#help')) {
    return;
  }
  db.Setting.find({
    where: {
      name: 'max_chans'
    }
  }).then(function(max_chans) {
    if (_.size(bot.chans) + 1 > max_chans) {
      if (chan.blocked) {
        bot.say(config.debugChan, utils.bold('[INVITE]') + ' Got invited to ' + utils.bold(channel) + ' by ' + utils.bold(from) + ', but my channel list is full: ' + utils.bold(_.size(bot.chans)) + '/' + utils.bold(max_chans) + ' channels joined.');
      }
      return bot.notice(from, "My channel list is currently full, so I'm unable to join your channel at this time.");
    }
  });
  return db.Chan.findOrCreate({
    where: {
      name: channel.toLowerCase()
    }
  }).then(function(chan) {
    chan = chan[0];
    if (chan.blocked) {
      return bot.say(config.debugChan, utils.bold('[INVITE]') + ' Got invited to ' + utils.bold(channel) + ' by ' + utils.bold(from) + ', but channel is blocked.');
    }
    bot.say(config.debugChan, utils.bold('[INVITE]') + ' Got invited to ' + utils.bold(channel) + ' by ' + utils.bold(from) + ', joining.');
    config.join_info = {
      channel: channel.toLowerCase(),
      invitee: from
    };
    return bot.join(channel, function() {
      bot.say(channel, "Hello, I am " + (utils.bold('YT-info')) + ", I am an URL information bot. I was invited here by " + (utils.bold(from)) + ". You can enable or disable my URL information by typing " + (utils.bold(config.prefix + 'enable')) + " or " + (utils.bold(config.prefix + 'disable')) + ". For more information PM " + (utils.bold('Dwarf')) + ".");
      return config.join_info = {};
    });
  });
});

bot.addListener('join_error', function(message) {
  bot.notice(config.join_info.invitee, 'I was unable to join your channel: ' + message.args[2]);
  part_chan(config.join_info.channel, false);
  return config.join_info = {};
});

bot.addListener('kick', function(channel, who, bywho, reason) {
  if (who !== bot.nick) {
    return;
  }
  return db.Chan.find({
    where: {
      name: channel.toLowerCase()
    }
  }).then(function(chan) {
    var extra;
    extra = '';
    if (!chan.blocked) {
      chan.destroy();
      extra = ', removing.';
    }
    return bot.say(config.debugChan, utils.bold('[KICK]') + ' Got kicked from ' + utils.bold(channel) + ' by ' + utils.bold(bywho) + ' (' + reason + ')' + extra);
  });
});

bot.addListener('ctcp-version', function(from) {
  return bot.ctcp(from, 'notice', 'VERSION ' + config.realName);
});

bot.addListener('motd', function() {
  config.registered = true;
  if (config.nsPass.length > 0) {
    bot.say('nickserv', 'id ' + config.nsPass);
  }
  bot.join(config.debugChan, function() {
    update_chans();
    bot.send('MODE', bot.nick, '+p');
    bot.say(config.debugChan, 'Joining ' + utils.bold(config.myChannels.length) + ' channels.');
    setTimeout(function() {
      var c, chans;
      chans = (function() {
        var _i, _len, _ref, _results;
        _ref = config.myChannels;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          _results.push(c.name.toLowerCase());
        }
        return _results;
      })();
      join_all_chans(chans);
    }, 3000);
  });
});

YT = require('./modules/youtube')(bot, utils, http, sprintf, vsprintf);

DM = require('./modules/dailymotion')(bot, utils, https, sprintf, vsprintf);

VM = require('./modules/vimeo')(bot, utils, http, sprintf, vsprintf);

SP = require('./modules/spotify')(bot, utils, https, sprintf, vsprintf);

TLD = require('./modules/tld')(bot, utils);

String.prototype.startsWith = function(needle) {
  return this.lastIndexOf(needle, 0) === 0;
};

String.prototype.contains = function(needle) {
  return this.lastIndexOf(needle) !== -1;
};

update_chans = function() {
  db.fetch_channels;
  return config.myChannels = db.channels;
};

channel_enabled = function(channel) {
  return db.Chan.find({
    where: {
      name: channel.toLowerCase()
    }
  }).then(function(chan) {
    return chan.active && !chan.blocked;
  });
};

join_all_chans = function(channels) {
  var chunk, i, j, temparray;
  temparray = [];
  chunk = 10;
  i = 0;
  j = channels.length;
  while (i < j) {
    temparray = channels.slice(i, i + chunk);
    i += chunk;
    bot.join(temparray.join(','));
  }
};

part_chan = function(chan, part) {
  if (part == null) {
    part = true;
  }
  return db.Chan.find({
    where: {
      name: chan.toLowerCase()
    }
  }).then(function(channel) {
    if (!channel.blocked) {
      channel.destroy();
    }
    if (part) {
      return bot.part(chan.toLowerCase());
    }
  });
};

Array.prototype.where = function(query) {
  var hit;
  if (typeof query !== "object") {
    return [];
  }
  hit = Object.keys(query).length;
  return this.filter(function(item) {
    var key, match, val;
    match = 0;
    for (key in query) {
      val = query[key];
      if (item[key] === val) {
        match += 1;
      }
    }
    if (match === hit) {
      return true;
    } else {
      return false;
    }
  });
};

//# sourceMappingURL=app.js.map
