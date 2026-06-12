const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');

const APP_PORT = Number(process.env.LEDGERFLOW_DESKTOP_PORT || process.env.PORT || 32123);
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

function startupHtml() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>LedgerFlow Hub</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #020617; color: #e5e7eb; font-family: Segoe UI, Arial, sans-serif; }
      .card { width: min(560px, calc(100vw - 48px)); padding: 32px; border: 1px solid rgba(148,163,184,.25); border-radius: 24px; background: rgba(15,23,42,.92); box-shadow: 0 24px 80px rgba(0,0,0,.35); }
      .badge { display: inline-flex; padding: 6px 10px; border-radius: 999px; background: rgba(59,130,246,.16); color: #bfdbfe; font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
      h1 { margin: 16px 0 8px; font-size: 28px; }
      p { color: #94a3b8; line-height: 1.6; }
      .loader { width: 36px; height: 36px; border-radius: 999px; border: 4px solid rgba(148,163,184,.25); border-top-color: #38bdf8; animation: spin 1s linear infinite; margin-top: 20px; }
      code { color: #bae6fd; }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <main class="card">
      <span class="badge">LedgerFlow Hub</span>
      <h1>Đang khởi động phần mềm...</h1>
      <p>Ứng dụng desktop đang mở server nội bộ tại <code>${APP_URL}</code>. Nếu có lỗi, LedgerFlow sẽ hiện thông báo và ghi log vào thư mục dữ liệu local.</p>
      <div class="loader"></div>
    </main>
  </body>
</html>`;
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
    show: true,
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
    if (!url.startsWith(APP_URL) && !url.startsWith('data:text/html')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(startupHtml())}`);
  mainWindow.focus();

  try {
    await waitForServer(APP_URL);
    logDesktop('Embedded server is ready. Loading app window.');
    await mainWindow.loadURL(APP_URL);
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

app.whenReady().then(() => {
  installApplicationMenu();
  createMainWindow();
  startEmbeddedServer();

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
