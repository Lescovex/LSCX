/*
  Config
*/
const path = require('path')

// ENVIROMENT
const ENV = 'dev';

// WINDOW OPTIONS
const WINDOW_OPTS = {
  width: 1000,
  height: 720,
  minWidth: 1000,
  minHeight: 720,
  'use-content-size': true,
  icon : path.join(__dirname ,'../lescovex.png'),
  webPreferences: {
    allowRunningInsecureContent: false,
    webSecurity: true,
  }
}

module.exports = {
  ENV,
  WINDOW_OPTS
}