const { app, BrowserWindow, shell, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');

const APP_PORT = 3000;
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
let mainWindow;

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

function startEmbeddedServer() {
  process.env.NODE_ENV = 'production';
  process.env.ELECTRON_DESKTOP = 'true';

  const appRoot = app.getAppPath();
  process.chdir(appRoot);
  redirectDbStorageToUserData();

  const serverEntry = path.join(appRoot, 'dist', 'server.cjs');
  if (!fs.existsSync(serverEntry)) {
    dialog.showErrorBox(
      'LedgerFlow Studio chưa được build',
      'Không tìm thấy dist/server.cjs. Hãy chạy: npm run build rồi chạy lại desktop.'
    );
    app.quit();
    return;
  }

  try {
    require(serverEntry);
  } catch (error) {
    dialog.showErrorBox('Không khởi động được server nội bộ', String(error?.stack || error));
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
        reject(new Error('Server nội bộ khởi động quá lâu.'));
        return;
      }
      setTimeout(probe, 300);
    };

    probe();
  });
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    title: 'LedgerFlow Studio',
    backgroundColor: '#020617',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  try {
    await waitForServer(APP_URL);
    await mainWindow.loadURL(APP_URL);
  } catch (error) {
    dialog.showErrorBox('LedgerFlow Studio lỗi khởi động', String(error?.message || error));
    app.quit();
  }
}

app.whenReady().then(() => {
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
