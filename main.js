const electron = require('electron')
const dialog = electron.dialog;
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 600, height: 800})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'login/login.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on(
    'activate',
    function() {
      // On OS X it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) {
        createWindow()
      }
    })

/*
 * ============================== NOTE ==============================
 * We use global state in order to exchange information among the various pages.
 * Ultimately this should be updated to use the electron IPC framework:
 * https://github.com/electron/electron/blob/master/docs/api/ipc-main.md
 */

const selectDir = function() {
  return dialog.showOpenDialog({properties: ['openDirectory']})[0];
}

const setSequence = function(seq) {
  global.sequence = seq;
}

const setIdConfig = function(userId, projectId, subprojectId, deploymentId, deploymentInfo) {
  global.metadata =
      {userId, projectId, subprojectId, deploymentId, deploymentInfo};
}

const getIdConfig = function() {
  return global.metadata;
}

exports.selectDir = selectDir;
exports.setSequence = setSequence;
exports.setIdConfig = setIdConfig;
exports.getIdConfig = getIdConfig;
