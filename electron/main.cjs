const { app, BrowserWindow, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const jsonServer = require('json-server');

let apiServer;

function ensureDatabase() {
  const dataDirectory = path.join(app.getPath('userData'), 'data');
  const databasePath = path.join(dataDirectory, 'db.json');

  fs.mkdirSync(dataDirectory, { recursive: true });
  if (!fs.existsSync(databasePath)) {
    const seedPath = app.isPackaged
      ? path.join(process.resourcesPath, 'data', 'db.json')
      : path.join(__dirname, '..', 'data', 'db.json');
    fs.copyFileSync(seedPath, databasePath);
  }

  return databasePath;
}

function startLocalServer() {
  const server = jsonServer.create();
  const router = jsonServer.router(ensureDatabase());
  const middlewares = jsonServer.defaults({
    logger: !app.isPackaged,
    static: app.isPackaged ? path.join(__dirname, '..', 'dist') : undefined,
  });

  server.use(middlewares);
  server.use(jsonServer.bodyParser);
  server.use('/api', router);

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
