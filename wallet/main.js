const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const url = require('url');
const { WINDOW_OPTS, ENV, MENU_TEMPLATE } = require('./config/config.js');
const { autoUpdater } = require("electron-updater");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow(WINDOW_OPTS);
    //Menu.setApplicationMenu(Menu.buildFromTemplate(MENU_TEMPLATE));

    if (process.platform === 'darwin') {
        var template = [{
            label: 'FromScratch',
            submenu: [{
                label: 'Quit',
                accelerator: 'Cmd+Q',
                click: function() {
                    app.quit();
                }
            }]
        }, {
            label: 'Edit',
            submenu: [{
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                selector: 'undo:'
            }, {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                selector: 'redo:'
            }, {
                type: 'separator'
            }, {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                selector: 'cut:'
            }, {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                selector: 'copy:'
            }, {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                selector: 'paste:'
            }, {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                selector: 'selectAll:'
            }]
        }];
        var osxMenu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(osxMenu);
    } else {
        //var menu = Menu.buildFromTemplate(MENU_TEMPLATE);
        //Menu.setApplicationMenu(menu)
    }
    // and load the index.html of the app.
    win.loadURL(`file://${__dirname}/build/index.html`);

    // Open the DevTools.
    //if (ENV == 'dev') win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow();
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function sendStatusToWindow(text) {
    let title = win.getTitle();
    win.setTitle(title + ": " + text);
}

autoUpdater.allowDowngrade = true;

autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', (ev, info) => {
    sendStatusToWindow('Update available.');
});

autoUpdater.on('update-not-available', (ev, info) => {

});

autoUpdater.on('error', (ev, err) => {
    sendStatusToWindow('Error in auto-updater.:' + err);
    process.stdout.write(ev, err);
});

autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    sendStatusToWindow(log_message);
});

autoUpdater.on('update-downloaded', (ev, info) => {
    sendStatusToWindow('Update downloaded; will install in 5 seconds');
    setTimeout(function() {
        autoUpdater.quitAndInstall();
    }, 5000)
});

autoUpdater.checkForUpdates();