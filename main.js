const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Gestion de la navigation vers les pages
ipcMain.on('navigate', (event, page) => {
  if(page === 'bluetooth'){
    mainWindow.loadFile('bluetooth.html');
  } else if(page === 'musique'){
    mainWindow.loadFile('musique.html');
  } else if(page === 'home'){
    mainWindow.loadFile('index.html');
  }
});
