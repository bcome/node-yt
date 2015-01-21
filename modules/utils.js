'use strict';
var numeral;

numeral = require('numeral');

module.exports = function(bot) {
  var bold, col, commify_numbers, say, since, strip_color, toHHMMSS;
  toHHMMSS = function(num) {
    var hours, minutes, sec_num, seconds, time;
    sec_num = parseInt(num, 10);
    hours = Math.floor(sec_num / 3600);
    minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    seconds = sec_num - (hours * 3600) - (minutes * 60);
    if (hours < 10) {
      hours = "0" + hours;
    }
    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    if (seconds < 10) {
      seconds = "0" + seconds;
    }
    time = '';
    if (hours > 0) {
      time += "" + hours + ":";
    }
    time += "" + minutes + ":" + seconds;
    return time;
  };
  since = function(date) {
    var elapsed, interval, intervals, parts, tense;
    date = Date.parse(date);
    intervals = [['day', 1], ['hour', 24], ['minute', 60], ['second', 60]];
    elapsed = (new Date).getTime() - date;
    elapsed = elapsed / 1000 / 3600 / 24;
    tense = elapsed > 0 ? 'since' : 'until';
    interval = 1.0;
    parts = intervals.map(function(item) {
      var number;
      interval /= item[1];
      number = Math.floor(elapsed / interval);
      elapsed = elapsed % interval;
      return "" + number + " " + item[0] + (number !== 1 ? 's' : void 0);
    });
    return "" + (parts.join(', ')) + " " + tense;
  };
  commify_numbers = function(num) {
    return numeral(num).format('0,0');
  };
  col = function(color, text) {
    return "\u0003" + color + text + "\u0003";
  };
  bold = function(text) {
    return "\u0002" + text + "\u0002";
  };
  say = function(chan, text) {
    if (bot === void 0) {
      return;
    }
    if (bot.chans === void 0) {
      return;
    }
    if (bot.chans[chan] === void 0) {
      return bot.say(chan, strip_color(text));
    }
    if (bot.chans[chan].mode === void 0) {
      return bot.say(chan, strip_color(text));
    }
    if (bot.chans[chan].mode.contains('c')) {
      return bot.say(chan, strip_color(text));
    } else {
      return bot.say(chan, text);
    }
  };
  strip_color = function(text) {
    while (/[\x02\x1F\x0F\x16]|\x03(\d\d?(,\d\d?)?)?/gi.exec(text) !== null) {
      text = text.replace(/[\x02\x1F\x0F\x16]|\x03(\d\d?(,\d\d?)?)?/gi, '');
    }
    return text;
  };
  return {
    toHHMMSS: toHHMMSS,
    since: since,
    col: col,
    bold: bold,
    commify_numbers: commify_numbers,
    say: say,
    strip_color: strip_color
  };
};

//# sourceMappingURL=utils.js.map
