const { app, BrowserWindow, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { createApiServer } = require('../server/api-server.cjs');
const { FileStore } = require('../server/file-store.cjs');

let apiServer;

function ensureDataDirectory() {
  const dataDirectory = path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(dataDirectory, { recursive: true });

  const legacyDatabasePath = path.join(dataDirectory, 'db.json');
  const hasFileData = fs.existsSync(path.join(dataDirectory, 'problems.csv'));
  if (!hasFileData && fs.existsSync(legacyDatabasePath)) {
    const database = JSON.parse(fs.readFileSync(legacyDatabasePath, 'utf8'));
    new FileStore(dataDirectory).importLegacy(database);
    fs.unlinkSync(legacyDatabasePath);
  } else if (!hasFileData) {
    const seedDirectory = app.isPackaged
      ? path.join(process.resourcesPath, 'data')
      : path.join(__dirname, '..', 'data');
    fs.cpSync(seedDirectory, dataDirectory, { recursive: true });
  }

  return dataDirectory;
}

function startLocalServer() {
  const server = createApiServer({
    dataDirectory: ensureDataDirectory(),
    staticDirectory: app.isPackaged ? path.join(__dirname, '..', 'dist') : undefined,
    logger: !app.isPackaged,
  });

  return new Promise((resolve, reject) => {
    const requestedPort = app.isPackaged ? 0 : 3131;
    apiServer = server.listen(requestedPort, '127.0.0.1', () => {
      resolve(apiServer.address().port);
    });
    apiServer.once('error', reject);
  });
}

function createWindow(port) {
  const appUrl = app.isPackaged ? `http://127.0.0.1:${port}` : 'http://localhost:5173';
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#09090b',
    title: 'Phenomenal Grind',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(appUrl)) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  window.loadURL(appUrl);
}

app.whenReady().then(async () => {
  const port = await startLocalServer();
  createWindow(port);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  apiServer?.close();
});
