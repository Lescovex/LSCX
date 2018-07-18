const { WINDOW_OPTS, ENV } = require('./config/config.js');
const { Core } = require('./src/core.js');
const { App } = require('./app/app.js');
require('./src/window.js');
require('./src/folder_selector.js');



window.onload = function () {
  Core.bootstrap(App);
  console.log('Renderer, awake');
}
