const { app, BrowserWindow, shell, dialog, Menu, session } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');

const APP_PORT = Number(process.env.LEDGERFLOW_DESKTOP_PORT || 32123);
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
let mainWindow;
let logFilePath;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
}

function getLogFilePath() {
  if (!logFilePath) {
    logFilePath = path.join(app.getPath('userData'), 'desktop-startup.log');
  }
  return logFilePath;
}

function logDesktop(message, error) {
  try {
    const details = error ? `\n${String(error?.stack || error)}` : '';
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.appendFileSync(
      getLogFilePath(),
      `[${new Date().toISOString()}] ${message}${details}\n`,
      'utf-8'
    );
  } catch {
    // Logging must never stop startup.
  }
}

function showStartupError(title, error) {
  const message = `${String(error?.message || error)}\n\nLog file:\n${getLogFilePath()}`;
  logDesktop(title, error);
  dialog.showErrorBox(title, message);
}

process.on('uncaughtException', (error) => {
  showStartupError('LedgerFlow Hub crashed during startup', error);
  app.quit();
});

process.on('unhandledRejection', (error) => {
  showStartupError('LedgerFlow Hub startup promise failed', error);
  app.quit();
});

function getDesktopIconPath() {
  const appRoot = app.getAppPath();
  const candidates = [
    path.join(appRoot, 'build', 'icon.ico'),
    path.join(process.resourcesPath || appRoot, 'build', 'icon.ico')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function redirectRuntimeStorageToUserData() {
  const userDataDir = app.getPath('userData');
  const runtimeFiles = new Map([
    ['db_storage.json', path.join(userDataDir, 'db_storage.json')],
    ['ai_keys.vault.json', path.join(userDataDir, 'ai_keys.vault.json')],
    ['.ledgerflow_secret', path.join(userDataDir, '.ledgerflow_secret')],
    ['.ai_vault_session.json', path.join(userDataDir, '.ai_vault_session.json')],
    ['ai_usage.log.json', path.join(userDataDir, 'ai_usage.log.json')],
    ['integration_registry.json', path.join(userDataDir, 'integration_registry.json')],
    ['integration_events.log.json', path.join(userDataDir, 'integration_events.log.json')]
  ]);

  const originalExistsSync = fs.existsSync.bind(fs);
  const originalReadFile = fs.promises.readFile.bind(fs.promises);
  const originalWriteFile = fs.promises.writeFile.bind(fs.promises);
  const originalAppendFile = fs.promises.appendFile.bind(fs.promises);
  const originalMkdir = fs.promises.mkdir.bind(fs.promises);

  const mapRuntimePath = (targetPath) => {
    if (typeof targetPath !== 'string') return targetPath;
    const fileName = path.basename(targetPath);
    return runtimeFiles.get(fileName) || targetPath;
  };

  fs.existsSync = (targetPath) => originalExistsSync(mapRuntimePath(targetPath));
  fs.promises.readFile = (targetPath, ...args) => originalReadFile(mapRuntimePath(targetPath), ...args);
  fs.promises.writeFile = async (targetPath, data, ...args) => {
    await originalMkdir(userDataDir, { recursive: true });
    return originalWriteFile(mapRuntimePath(targetPath), data, ...args);
  };
  fs.promises.appendFile = async (targetPath, data, ...args) => {
    await originalMkdir(userDataDir, { recursive: true });
    return originalAppendFile(mapRuntimePath(targetPath), data, ...args);
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
          label: 'Open startup log',
          click: () => shell.openPath(getLogFilePath())
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

async function clearLegacyWebRuntimeCache() {
  try {
    await session.defaultSession.clearStorageData({
      origins: [APP_URL],
      storages: ['serviceworkers', 'cachestorage']
    });
    await session.defaultSession.clearCache();
    logDesktop('Cleared legacy PWA service worker and renderer cache.');
  } catch (error) {
    logDesktop('Could not clear legacy renderer cache; continuing startup.', error);
  }
}

function startEmbeddedServer() {
  process.env.NODE_ENV = 'production';
  process.env.ELECTRON_DESKTOP = 'true';
  process.env.PORT = String(APP_PORT);

  const appRoot = app.getAppPath();
  process.chdir(appRoot);
  redirectRuntimeStorageToUserData();

  const serverEntry = path.join(appRoot, 'dist', 'server.cjs');
  logDesktop(`Starting embedded server from ${serverEntry} on ${APP_URL}`);

  if (!fs.existsSync(serverEntry)) {
    showStartupError(
      'LedgerFlow Hub is not built',
      new Error('dist/server.cjs was not found. Download the Windows release artifact or run npm run build before launching desktop.')
    );
    app.quit();
    return;
  }

  require(serverEntry);
}

function waitForServer(url, timeoutMs = 30000) {
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
        reject(new Error(`Embedded server startup timed out at ${url}.`));
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

  mainWindow.webContents.on('console-message', (_event, details) => {
    const message = typeof details === 'object'
      ? `[renderer:${details.level}] ${details.message} (${details.sourceId || 'unknown'}:${details.lineNumber || 0})`
      : `[renderer] ${String(details)}`;
    logDesktop(message);
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame !== false) {
      logDesktop(`Renderer failed to load ${validatedURL}: ${errorCode} ${errorDescription}`);
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logDesktop(`Renderer process exited: ${details.reason} (code ${details.exitCode})`);
  });

  try {
    await waitForServer(APP_URL);
    logDesktop('Embedded server is ready. Loading app window.');
    await mainWindow.loadURL(APP_URL);
    const rendererState = await mainWindow.webContents.executeJavaScript(`({
      url: location.href,
      title: document.title,
      rootChildren: document.getElementById('root')?.childElementCount ?? -1,
      bodyTextLength: document.body?.innerText?.length ?? 0
    })`);
    logDesktop(`Renderer loaded: ${JSON.stringify(rendererState)}`);
    mainWindow.show();
    mainWindow.focus();
  } catch (error) {
    showStartupError('LedgerFlow Hub startup error', error);
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

function checkAlreadyRunning(url) {
  return new Promise((resolve) => {
    const req = http.get(`${url}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json && json.status === 'ok' && json.desktop === true);
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

app.whenReady().then(async () => {
  await clearLegacyWebRuntimeCache();
  installApplicationMenu();

  const alreadyRunning = await checkAlreadyRunning(APP_URL);
  if (alreadyRunning) {
    logDesktop(`LedgerFlow server already running at ${APP_URL}. Reusing existing instance.`);
    createMainWindow();
  } else {
    logDesktop(`No running server detected at ${APP_URL}. Starting embedded server.`);
    createMainWindow();
    startEmbeddedServer();
  }

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
