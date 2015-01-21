'use strict'
Sequelize = require('sequelize')
sequelize = new Sequelize('bot', 'root', 'toor', {
  dialect: 'sqlite'
  storage: './bot.sqlite'
})

sequelize.authenticate()
.complete((err) ->
  if (!!err)
    console.error 'Unable to connect to the database: ', err
  else
    console.log 'Database connection has been established successfully.'
    synchronize()
)

Chan = sequelize.define('Chan', {
  name: Sequelize.STRING
  blocked: {
    type: Sequelize.BOOLEAN
    defaultValue: false
  }
  active: {
    type: Sequelize.BOOLEAN
    defaultValue: true
  }
})

Setting = sequelize.define('Setting', {
  name: Sequelize.STRING
  value: Sequelize.STRING
})

Ignore = sequelize.define('Ignore', {
  nick: Sequelize.STRING
  host: Sequelize.STRING
})

synchronize = ->
  sequelize
  .sync({ force: false })
  .complete((err) ->
    if (!!err)
      console.error('An error occurred while creating the table: ', err)
    else
      console.log 'Synchronized the database.'
  )


fetch_channels = ->
  Chan.all({where: { blocked: false }}).then((channels) ->
    exports.channels = channels
  )

exports.Sequelize = Sequelize
exports.sequelize = sequelize
exports.Chan = Chan
exports.Setting = Setting
exports.synchronize = synchronize()
exports.fetch_channels = fetch_channels()