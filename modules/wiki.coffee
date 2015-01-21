'use strict'
parseString = require('xml2js').parseString
http = require('http')
_ = require('underscore')

class Wiki
  constructor: ->
    @interval = 60
    @last_date = 0
  check: ->
    try
      req = http.get('http://wiki.rizon.net/index.php?title=Special:RecentChanges&feed=atom', (res) ->
        data = ''
        res.on 'data', (chunk) ->
          data += chunk
        res.on 'end', ->
          result = parseString(data, (err, result) ->
            return result
          )
          feed = result.feed
          JSON.stringify(feed)
          entries = _.pick(feed, 'entry')
          max_date = @last_date

          for entry in entries.reverse
            do (entry) ->
              date = Date.parse(_.pick(entry, 'updated').updated[0])
              if date > @last_date
                max_date = _.max([max_date, date])
                title = _.pick(entry, 'title').title[0]
                link = _.pick(entry, 'id').id[0]
                author = _.pick(_.pick(entry, 'author').author[0], 'name').name[0]
                console.log "#{title} modified by #{author} (#{link})"
              @last_date = max_date
              @last_error = ''
              return
            return
#          )
      )
      req.on 'error', (err) ->
        console.error err
      req.end()
    catch e
      console.error e


test = new Wiki()
test.check()