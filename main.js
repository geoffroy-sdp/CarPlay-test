const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dbus = require('dbus-next');
const sessionBus = dbus.sessionBus();

let mainWindow;

app.disableHardwareAcceleration();
process.env.ELECTRON_DISABLE_GPU = '1';
process.env.ELECTRON_ENABLE_LOGGING = '1';
process.env.ELECTRON_ENABLE_STACK_DUMPING = '1';

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

// Navigation entre pages
ipcMain.on('navigate', (event, page) => {
  if(page === 'bluetooth'){
    mainWindow.loadFile('bluetooth.html').then(() => {
      setImmediate(() => setupBluetooth());
    });
  } else if(page === 'musique'){
    mainWindow.loadFile('musique.html');
  } else if(page === 'home'){
    mainWindow.loadFile('index.html');
  }
});

// ----------------------
// Bluetooth via DBus
// ----------------------
async function setupBluetooth() {
    try {
        const obj = await sessionBus.getProxyObject('org.bluez', '/');
        const manager = obj.getInterface('org.freedesktop.DBus.ObjectManager');
        const objects = await manager.GetManagedObjects();

        // Parcours pour trouver MediaPlayer1
        for (const [path, interfaces] of Object.entries(objects)) {
            if (interfaces['org.bluez.MediaPlayer1']) {
                const playerIface = interfaces['org.bluez.MediaPlayer1'];
                console.log('Player trouvé:', path);
            }
        }

        // Écoute des changements de propriétés
        sessionBus.on('PropertiesChanged', (iface, changed, invalidated) => {
            if (!iface.includes('org.bluez.MediaPlayer1')) return;

            if (changed.Metadata) {
                const meta = changed.Metadata;
                const title = meta['xesam:title']?.value || 'Titre inconnu';
                const artist = meta['xesam:artist']?.value?.[0] || 'Artiste inconnu';
                const album = meta['xesam:album']?.value || '';
                mainWindow.webContents.send('bt-meta', { title, artist, album });
            }

            if (changed.Connected !== undefined) {
                mainWindow.webContents.send('bt-status', changed.Connected ? 'connecté' : 'déconnecté');
            }
        });

    } catch (err) {
        console.error('Erreur Bluetooth :', err);
    }
}
