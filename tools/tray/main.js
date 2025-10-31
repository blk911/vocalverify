const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const appName = 'Amihuman Snapshot';
const baseDir = process.env.LOCALAPPDATA || process.env.TEMP;
const rootDir = path.join(baseDir, 'AmihumanSnapshot');
const reqDir = path.join(rootDir, 'requests');
const resDir = path.join(rootDir, 'responses');
let tray;

function ensureDirs() {
  [rootDir, reqDir, resDir].forEach((p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); });
}

function createTray() {
  const icon = nativeImage.createFromBuffer(Buffer.alloc(0)); // default dot
  tray = new Tray(icon);
  tray.setToolTip(`${appName} — running`);
  const menu = Menu.buildFromTemplate([
    { label: 'Open data folder', click: () => require('electron').shell.openPath(rootDir) },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ]);
  tray.setContextMenu(menu);
}

function promptYesNo({ id, branch, timeoutSec = 45, question }) {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 360, height: 160, resizable: false, alwaysOnTop: true, frame: true, show: false,
      webPreferences: { preload: path.join(__dirname, 'preload.js') },
    });
    win.loadFile(path.join(__dirname, 'renderer.html'));
    win.once('ready-to-show', () => {
      win.webContents.send('prompt:init', { id, branch, timeoutSec, question });
      win.show();
    });

    const timer = setTimeout(() => { try { if (!win.isDestroyed()) win.close(); } catch {} ; resolve('Timeout'); }, timeoutSec * 1000);

    const { ipcMain } = require('electron');
    const ch = `prompt:decision:${id}`;
    const handler = (_e, decision) => {
      clearTimeout(timer);
      try { if (!win.isDestroyed()) win.close(); } catch {}
      ipcMain.removeAllListeners(ch);
      resolve(decision);
    };
    ipcMain.on(ch, handler);
  });
}

async function processRequest(file) {
  const full = path.join(reqDir, file);
  let data;
  try { data = JSON.parse(fs.readFileSync(full, 'utf8')); if (!data || !data.id) return; } catch { return; }
  const decision = await promptYesNo({
    id: data.id,
    branch: data.branch || 'wip/spencer',
    timeoutSec: data.timeoutSec || 45,
    question: data.question || `Commit & push to '${data.branch}' now?`,
  });
  const resp = { id: data.id, decision: decision === 'Yes' ? 'Yes' : decision === 'No' ? 'No' : 'Timeout', at: new Date().toISOString() };
  fs.writeFileSync(path.join(resDir, `${data.id}.json`), JSON.stringify(resp));
  try { fs.unlinkSync(full); } catch {}
}

function startWatcher() {
  fs.watch(reqDir, { persistent: true }, (event, filename) => {
    if (event === 'rename' && filename && filename.endsWith('.json')) {
      setTimeout(() => processRequest(filename), 100);
    }
  });
  for (const f of fs.readdirSync(reqDir)) { if (f.endsWith('.json')) processRequest(f); }
}

app.whenReady().then(() => { 
  ensureDirs(); 
  createTray(); 
  startWatcher(); 
});
app.on('window-all-closed', (e) => e.preventDefault());
