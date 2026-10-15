import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let serverProcess = null;
const SERVER_PORT = process.env.PORT || 3001;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const ICON_PATH = path.join(__dirname, '../assets/icon.png');

app.name = 'DeloSpace';

function isServerReady(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode < 500);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function ensureServerRunning() {
  const ready = await isServerReady(SERVER_URL);
  if (ready) {
    console.log('[DeloSpace Electron] Backend server already running on port', SERVER_PORT);
    return;
  }

  console.log('[DeloSpace Electron] Launching embedded DeloSpace server...');
  const serverPath = path.join(__dirname, '../server/index.js');
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, PORT: SERVER_PORT.toString() },
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('[DeloSpace Electron] Failed to start embedded server:', err);
  });

  // Wait up to 10 seconds for server to be ready
  const start = Date.now();
  while (Date.now() - start < 10000) {
    if (await isServerReady(SERVER_URL)) {
      console.log('[DeloSpace Electron] Embedded backend server is live!');
      return;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0A0908',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    title: 'DeloSpace · The AI Agent Board',
    icon: ICON_PATH,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: false // allow localhost iframes for WebTile
    }
  });

  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(ICON_PATH);
  }

  // Open external links in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  await ensureServerRunning();
  mainWindow.loadURL(SERVER_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
