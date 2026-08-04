/*
 * Desktop wrapper for T-Rex Runner.
 *
 * The game is index.html - this file only opens a window and points at it.
 * Nothing is loaded over the network, so the renderer gets no Node access and
 * no remote content is ever permitted.
 */

const { app, BrowserWindow, Menu, shell, screen } = require('electron');
const path = require('path');

// Chrome's own dino game is a 600x150 strip; give it room to breathe but keep
// the window in roughly that proportion so the canvas fills it.
const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 460;

let mainWindow = null;

function createWindow() {
  const { width: screenWidth, height: screenHeight } =
      screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(DEFAULT_WIDTH, screenWidth - 40),
    height: Math.min(DEFAULT_HEIGHT, screenHeight - 40),
    minWidth: 420,
    minHeight: 260,
    backgroundColor: '#ffffff',
    title: 'T-Rex Runner',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      // The page is a self-contained document; it needs nothing from Node.
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false
    }
  });

  // No application menu - Alt would otherwise flash a menu bar mid-jump.
  Menu.setApplicationMenu(null);

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Avoid the white flash before the first paint.
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('closed', () => { mainWindow = null; });

  // F11 toggles fullscreen; Ctrl/Cmd+Q quits. Everything else goes to the game.
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      event.preventDefault();
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    } else if ((input.control || input.meta) && input.key.toLowerCase() === 'q') {
      event.preventDefault();
      app.quit();
    }
  });

  // This app has no business opening anything else, in-window or out.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
}

// One instance is enough; focus the existing window instead of opening another.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
