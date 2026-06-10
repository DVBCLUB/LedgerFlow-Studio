const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');

const APP_PORT = 3000;
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
let mainWindow;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

function getDesktopIconPath() {
  const appRoot = app.getAppPath();
  const candidates = [
    path.join(appRoot, 'build', 'icon.ico'),
    path.join(process.resourcesPath || appRoot, 'build', 'icon.ico')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function redirectDbStorageToUserData() {
  const userDataDir = app.getPath('userData');
  const dbFile = path.join(userDataDir, 'db_storage.json');

  const originalExistsSync = fs.existsSync.bind(fs);
  const originalReadFile = fs.promises.readFile.bind(fs.promises);
  const originalWriteFile = fs.promises.writeFile.bind(fs.promises);

  const mapDbPath = (targetPath) => {
    if (typeof targetPath === 'string' && targetPath.endsWith('db_storage.json')) {
      return dbFile;
    }
    return targetPath;
  };

  fs.existsSync = (targetPath) => originalExistsSync(mapDbPath(targetPath));
  fs.promises.readFile = (targetPath, ...args) => originalReadFile(mapDbPath(targetPath), ...args);
  fs.promises.writeFile = async (targetPath, data, ...args) => {
    await fs.promises.mkdir(userDataDir, { recursive: true });
    return originalWriteFile(mapDbPath(targetPath), data, ...args);
  };
}

function installApplicationMenu() {
  const template = [
    {
      label: 'LedgerFlow Hub',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { type: 'separator' },
        { label: 'Exit', accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4', click: () => app.quit() }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Open local data folder',
          click: () => shell.openPath(app.getPath('userData'))
        },
        {
          label: 'Open DevTools',
          accelerator: 'F12',
          click: () => mainWindow?.webContents.openDevTools({ mode: 'detach' })
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function startEmbeddedServer() {
  process.env.NODE_ENV = 'production';
  process.env.ELECTRON_DESKTOP = 'true';

  const appRoot = app.getAppPath();
  process.chdir(appRoot);
  redirectDbStorageToUserData();

  const serverEntry = path.join(appRoot, 'dist', 'server.cjs');
  if (!fs.existsSync(serverEntry)) {
    dialog.showErrorBox(
      'LedgerFlow Hub is not built',
      'dist/server.cjs was not found. Run npm run build before launching desktop.'
    );
    app.quit();
    return;
  }

  try {
    require(serverEntry);
  } catch (error) {
    dialog.showErrorBox('Embedded server failed to start', String(error?.stack || error));
    app.quit();
  }
}

function waitForServer(url, timeoutMs = 15000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const probe = () => {
      const req = http.get(`${url}/api/health`, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });

      req.on('error', retry);
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error('Embedded server startup timed out.'));
        return;
      }
      setTimeout(probe, 300);
    };

    probe();
  });
}

async function createMainWindow() {
  const icon = getDesktopIconPath();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    title: 'LedgerFlow Hub',
    backgroundColor: '#020617',
    show: false,
    ...(icon ? { icon } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  try {
    await waitForServer(APP_URL);
    await mainWindow.loadURL(APP_URL);
  } catch (error) {
    dialog.showErrorBox('LedgerFlow Hub startup error', String(error?.message || error));
    app.quit();
  }
}

app.setName('LedgerFlow Hub');
app.setAppUserModelId('com.ledgerflow.hub');

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  installApplicationMenu();
  startEmbeddedServer();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
