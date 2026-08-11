const { app, BrowserWindow, shell, dialog, Menu, session } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');

const net = require('net');

let APP_PORT = Number(process.env.LEDGERFLOW_DESKTOP_PORT || 32123);
let APP_URL = `http://127.0.0.1:${APP_PORT}`;
let mainWindow;
let logFilePath;

function checkPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function getFirstFreePort(startPort) {
  let port = startPort;
  while (port < startPort + 100) {
    if (await checkPortFree(port)) {
      return port;
    }
    port++;
  }
  return startPort;
}

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
  const appRoot = app.getAppPath();
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
  const originalReadFileSync = fs.readFileSync.bind(fs);
  const originalWriteFileSync = fs.writeFileSync.bind(fs);
  const originalAppendFileSync = fs.appendFileSync.bind(fs);
  
  const originalReadFile = fs.promises.readFile.bind(fs.promises);
  const originalWriteFile = fs.promises.writeFile.bind(fs.promises);
  const originalAppendFile = fs.promises.appendFile.bind(fs.promises);
  const originalMkdir = fs.promises.mkdir.bind(fs.promises);

  const mapRuntimePath = (targetPath) => {
    if (typeof targetPath !== 'string') return targetPath;
    
    // Quick check to bypass node_modules, dist, and desktop paths
    if (targetPath.includes('node_modules') || targetPath.includes('dist') || targetPath.includes('desktop')) {
      return targetPath;
    }
    
    const absPath = path.resolve(targetPath);
    const fileName = path.basename(absPath);
    
    if (runtimeFiles.has(fileName)) {
      return runtimeFiles.get(fileName);
    }
    
    const relativeToRoot = path.relative(appRoot, absPath);
    const isUnderRoot = !relativeToRoot.startsWith('..') && !path.isAbsolute(relativeToRoot);
    
    if (isUnderRoot) {
      const parts = relativeToRoot.split(path.sep);
      const isSystemSubfolder = parts[0] === 'dist' || parts[0] === 'desktop' || parts[0] === 'node_modules';
      
      if (!isSystemSubfolder) {
        const ext = path.extname(fileName).toLowerCase();
        const isWritablePattern = 
          ext === '.json' || 
          ext === '.log' || 
          ext === '.secret' || 
          fileName.startsWith('.') ||
          fileName.includes('_storage') ||
          fileName.includes('_registry');
          
        if (isWritablePattern && fileName !== 'package.json') {
          const redirectedPath = path.join(userDataDir, fileName);
          logDesktop(`Dynamically redirecting runtime path: ${targetPath} -> ${redirectedPath}`);
          return redirectedPath;
        }
      }
    }
    
    return targetPath;
  };

  fs.existsSync = (targetPath) => originalExistsSync(mapRuntimePath(targetPath));
  fs.readFileSync = (targetPath, ...args) => originalReadFileSync(mapRuntimePath(targetPath), ...args);
  fs.writeFileSync = (targetPath, data, ...args) => {
    fs.mkdirSync(userDataDir, { recursive: true });
    return originalWriteFileSync(mapRuntimePath(targetPath), data, ...args);
  };
  fs.appendFileSync = (targetPath, data, ...args) => {
    fs.mkdirSync(userDataDir, { recursive: true });
    return originalAppendFileSync(mapRuntimePath(targetPath), data, ...args);
  };

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
        {
          label: 'Reload (Hard Refresh)',
          accelerator: 'CmdOrCtrl+R',
          click: async () => {
            if (mainWindow) {
              await session.defaultSession.clearCache().catch(() => {});
              mainWindow.webContents.reloadIgnoringCache();
            }
          }
        },
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

  // Also start the AI Assistant Daemon on port 3001
  const daemonEntry = path.join(appRoot, 'dist', 'assistant-daemon.cjs');
  if (fs.existsSync(daemonEntry)) {
    logDesktop(`Starting AI daemon from ${daemonEntry} on port 3001`);
    try {
      require(daemonEntry);
    } catch (err) {
      logDesktop('AI daemon failed to start (non-critical)', err);
    }
  } else {
    logDesktop('AI daemon not found — AI assistant features unavailable. Run npm run build to include it.');
  }
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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #020617;
        color: #f8fafc;
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        overflow: hidden;
        position: relative;
      }
      .glow-bg {
        position: absolute;
        width: 600px;
        height: 600px;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 100%);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1;
        filter: blur(80px);
        animation: pulseGlow 8s ease-in-out infinite alternate;
      }
      @keyframes pulseGlow {
        0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1.2; }
      }
      .card {
        position: relative;
        z-index: 2;
        width: min(500px, calc(100vw - 40px));
        padding: 40px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        text-align: center;
        animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes slideUp {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .logo-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 24px;
      }
      .logo-icon {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 30px rgba(56, 189, 248, 0.3);
        font-weight: 800;
        font-size: 32px;
        color: #ffffff;
        letter-spacing: -1px;
        animation: float 4s ease-in-out infinite;
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(3deg); }
      }
      .badge {
        display: inline-flex;
        padding: 6px 14px;
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
        border: 1px solid rgba(56, 189, 248, 0.2);
        color: #38bdf8;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-bottom: 16px;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 24px;
        font-weight: 700;
        background: linear-gradient(to right, #ffffff, #cbd5e1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      p {
        color: #94a3b8;
        font-size: 14px;
        line-height: 1.6;
        margin: 0 0 28px;
      }
      .progress-container {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 999px;
        overflow: hidden;
        position: relative;
        margin-bottom: 12px;
      }
      .progress-bar {
        height: 100%;
        width: 35%;
        background: linear-gradient(90deg, #38bdf8, #6366f1);
        border-radius: 999px;
        position: absolute;
        animation: progressAnim 2s ease-in-out infinite;
      }
      @keyframes progressAnim {
        0% { left: -35%; }
        100% { left: 100%; }
      }
      .status-text {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }
      code {
        color: #bae6fd;
        font-family: Consolas, Monaco, monospace;
        background: rgba(186, 230, 253, 0.08);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <div class="glow-bg"></div>
    <main class="card">
      <div class="logo-container">
        <div class="logo-icon">LF</div>
      </div>
      <span class="badge">LedgerFlow Hub</span>
      <h1>Đang khởi động hệ thống...</h1>
      <p>Thiết lập máy chủ cục bộ an toàn tại <code>${APP_URL}</code></p>
      <div class="progress-container">
        <div class="progress-bar"></div>
      </div>
      <div class="status-text">Đang tải cấu hình và kiểm tra hệ thống...</div>
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

  mainWindow.webContents.on('console-message', (_event, details) => {
    const message = typeof details === 'object'
      ? `[renderer:${details.level}] ${details.message} (${details.sourceId || 'unknown'}:${details.lineNumber || 0})`
      : `[renderer] ${String(details)}`;
    logDesktop(message);
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame !== false && errorCode !== -3 && errorCode !== -2) {
      logDesktop(`Renderer failed to load ${validatedURL}: ${errorCode} ${errorDescription}`);
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logDesktop(`Renderer process exited: ${details.reason} (code ${details.exitCode})`);
  });

  // Load premium visual startup screen instantly
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(startupHtml())}`).catch(() => {});
  mainWindow.focus();

  try {
    await waitForServer(APP_URL);
    logDesktop('Embedded server is ready. Loading app window.');
    await mainWindow.loadURL(APP_URL).catch((err) => {
      if (err && (err.code === 'ERR_ABORTED' || String(err).includes('(-3)'))) {
        logDesktop('Ignored splash navigation abort (-3).');
        return;
      }
      throw err;
    });
    const rendererState = await mainWindow.webContents.executeJavaScript(`({
      url: location.href,
      title: document.title,
      rootChildren: document.getElementById('root')?.childElementCount ?? -1,
      bodyTextLength: document.body?.innerText?.length ?? 0
    })`).catch(() => null);
    if (rendererState) {
      logDesktop(`Renderer loaded: ${JSON.stringify(rendererState)}`);
    }
  } catch (error) {
    if (error && (error.code === 'ERR_ABORTED' || String(error.message || error).includes('(-3)'))) {
      logDesktop('Ignored splash navigation abort error.');
    } else {
      showStartupError('LedgerFlow Hub startup error', error);
    }
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
  // Clear legacy cache in the background without blocking startup
  clearLegacyWebRuntimeCache().catch((err) => logDesktop('Cache clear failed', err));
  
  installApplicationMenu();

  const alreadyRunning = await checkAlreadyRunning(APP_URL);
  if (alreadyRunning) {
    logDesktop(`LedgerFlow server already running at ${APP_URL}. Reusing existing instance.`);
    createMainWindow();
  } else {
    const freePort = await getFirstFreePort(APP_PORT);
    if (freePort !== APP_PORT) {
      logDesktop(`Default port ${APP_PORT} is not free. Selected free port: ${freePort}`);
      APP_PORT = freePort;
      APP_URL = `http://127.0.0.1:${APP_PORT}`;
    }

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
