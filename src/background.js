'use strict'

import {
  app,
  protocol,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain
} from 'electron'
import os from 'os'
import Store from 'electron-store'
import {
  enforceMacOSAppLocation
} from 'electron-util'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
import {
  checkForUpdates
} from './updater'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let winUrl
let tray, trayImage
let articleSelected = false
let menu

const store = new Store()

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
    secure: true,
    standard: true
  }
}])

function createMenu() {
  // Create the Application's main menu
  const template = [{
      label: 'Edit',
      submenu: [{
          role: 'undo'
        },
        {
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          role: 'cut'
        },
        {
          role: 'copy'
        },
        {
          role: 'paste'
        },
        {
          role: 'pasteandmatchstyle'
        },
        {
          role: 'delete'
        },
        {
          role: 'selectall'
        }
      ]
    },
    {
      label: 'View',
      submenu: [{
        role: 'togglefullscreen'
      }]
    },
    {
      role: 'window',
      submenu: [{
          role: 'minimize'
        },
        {
          role: 'close'
        }
      ]
    },
    {
      label: 'Subscriptions',
      submenu: [{
        label: 'Add subscription',
        accelerator: 'CmdOrCtrl+N',
        click: function () {
          win.webContents.send('Add subscription')
        }
      }]
    },
    {
      label: 'Item',
      submenu: [{
          label: 'Next item',
          accelerator: 'CmdOrCtrl+J',
          click: function () {
            win.webContents.send('Next item')
          }
        },
        {
          label: 'Previous item',
          accelerator: 'CmdOrCtrl+K',
          click: function () {
            win.webContents.send('Previous item')
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Toggle read',
          id: 'toggle-read',
          accelerator: 'CmdOrCtrl+T',
          enabled: articleSelected,
          click: function () {
            win.webContents.send('Toggle read')
          }
        },
        {
          label: 'Toggle favourite',
          id: 'toggle-favourite',
          accelerator: 'CmdOrCtrl+S',
          enabled: articleSelected,
          click: function () {
            win.webContents.send('Toggle favourite')
          }
        },
        {
          label: 'Mark all read',
          id: 'mark-all-read',
          accelerator: 'Alt+R',
          click: function () {
            win.webContents.send('Mark all read')
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Save offline',
          id: 'save-offline',
          accelerator: 'CmdOrCtrl+O',
          enabled: articleSelected,
          click: function () {
            win.webContents.send('Save offline')
          }
        },
        {
          label: 'View in browser',
          id: 'view-browser',
          accelerator: 'CmdOrCtrl+B',
          enabled: articleSelected,
          click: function () {
            win.webContents.send('View in browser')
          }
        }
      ]
    }
  ]

  const version = app.getVersion()

  if (process.platform === 'win32' || process.platform === 'linux') {
    template.unshift({
      label: 'Raven Reader',
      submenu: [{
          label: `Version ${version}`,
          enabled: false
        },
        {
          label: 'Check for update',
          click: function (menuItem, browserWindow, event) {
            checkForUpdates(menuItem, browserWindow, event)
          }
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    })
  }

  if (process.platform === 'darwin') {
    template.unshift({
      label: 'Raven Reader',
      submenu: [{
          role: 'about'
        },
        {
          label: `Version ${version}`,
          enabled: false
        },
        {
          label: 'Check for update',
          click: function (menuItem, browserWindow, event) {
            checkForUpdates(menuItem, browserWindow, event)
          }
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    })

    // Edit menu
    template[1].submenu.push({
      type: 'separator'
    }, {
      label: 'Speech',
      submenu: [{
          role: 'startspeaking'
        },
        {
          role: 'stopspeaking'
        }
      ]
    })

    // Window menu
    template[3].submenu = [{
        role: 'close'
      },
      {
        role: 'minimize'
      },
      {
        role: 'zoom'
      },
      {
        type: 'separator'
      },
      {
        role: 'front'
      }
    ]
  }

  menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createTray() {
  if (os.platform() === 'darwin') {
    trayImage = require('path').join(__static, '/mactrayiconTemplate.png')
  }

  if (os.platform() === 'win32') {
    trayImage = require('path').join(__static, '/windowstrayicon.ico')
  }

  if (os.platform() === 'linux') {
    trayImage = require('path').join(__static, '/trayicon-linux.png')
  }

  tray = new Tray(trayImage)

  const contextMenu = Menu.buildFromTemplate([{
    label: 'Quit',
    click: () => {
      app.isQuiting = true
      app.quit()
    }
  }])

  tray.on('right-click', () => {
    tray.popUpContextMenu(contextMenu)
  })
  tray.on('click', () => {
    win.show()
    if (process.platform === 'darwin' && !app.dock.isVisible()) {
      app.dock.show()
    }
  })
}

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1204,
    height: 768,
    minHeight: 768,
    minWidth: 1204,
    title: 'Raven Reader',
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: false
    }
  })

  const proxy = store.get('settings.proxy') ? store.get('settings.proxy') : null
  let proxyRules = 'direct://'
  if (proxy) {
    if (proxy.http !== null && proxy.https === null) {
      proxyRules = `http=${proxy.http},${proxyRules}`
    }
    if (proxy.http !== null && proxy.https !== null) {
      roxyRules = `http=${proxy.http};https=${proxy.https},${proxyRules}`
    }
  }

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    winUrl = process.env.WEBPACK_DEV_SERVER_URL
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    winUrl = 'app://./index.html'
  }

  win.loadURL('app://./index.html')
  win.webContents.session.setProxy({
    proxyRules: proxyRules,
    proxyBypassRules: proxy && proxy.bypass ? proxy.bypass : '<local>'
  }, () => {
    win.loadURL(winUrl)
  })

  win.on('closed', () => {
    win = null
  })

  createMenu()
  createTray()
}

app.requestSingleInstanceLock()
app.on('second-instance', (event, argv, cwd) => {
  app.quit()
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
  enforceMacOSAppLocation()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
