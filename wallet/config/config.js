/*
  Config
*/
const path = require('path')

// ENVIROMENT
//const ENV = 'dev';
const ENV = 'prod';

// WINDOW OPTIONS
const WINDOW_OPTS = {
    width: 1000,
    height: 720,
    minWidth: 1000,
    minHeight: 720,
    'use-content-size': false,
    icon: path.join(__dirname, '../lescovex.png'),
    webPreferences: {
        allowRunningInsecureContent: false,
        webSecurity: true
    }
}


const MENU_TEMPLATE = [{
    label: "Application",
    submenu: [
        { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
        { type: "separator" },
        { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); } }
    ]
}, {
    label: "Edit",
    submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]
}];


module.exports = {
    ENV,
    WINDOW_OPTS,
    MENU_TEMPLATE
}
