const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dbus = require('dbus-next');

const systemBus = dbus.systemBus();  // BlueZ n'est accessible que sur systemBus

let mainWindow;

app.disableHardwareAcceleration();
process.env.ELECTRON_DISABLE_GPU = '1';

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

// Navigation
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

// Vérifie BlueZ
ipcMain.handle('bluetooth-get-status', async () => {
    try {
        await systemBus.getProxyObject('org.bluez', '/');
        return 'OK, BlueZ accessible!';
    } catch (err) {
        return `Erreur : ${err}`;
    }
});

// ----------------------
// Bluetooth via DBus
// ----------------------
async function setupBluetooth() {
  try {
    const obj = await systemBus.getProxyObject('org.bluez', '/');
    const manager = obj.getInterface('org.freedesktop.DBus.ObjectManager');
    const objects = await manager.GetManagedObjects();

    for (const [path, interfaces] of Object.entries(objects)) {
      if (interfaces['org.bluez.MediaPlayer1']) {
        console.log('Player trouvé à', path);

        // Crée un proxy pour le chemin du player
        const playerObj = await systemBus.getProxyObject('org.bluez', path);
        const props = playerObj.getInterface('org.freedesktop.DBus.Properties');

        // Envoie les métadonnées actuelles
        const metadata = interfaces['org.bluez.MediaPlayer1'].Metadata;
        if(metadata) {
          const title = metadata['xesam:title']?.value || 'Titre inconnu';
          const artist = metadata['xesam:artist']?.value?.[0] || 'Artiste inconnu';
          const album = metadata['xesam:album']?.value || '';
          mainWindow.webContents.send('bt-meta', { title, artist, album });
        }

        // Écoute les changements
        props.on('PropertiesChanged', (iface, changed) => {
          if(iface !== 'org.bluez.MediaPlayer1') return;

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
      }
    }
  } catch (err) {
    console.error('Erreur Bluetooth :', err);
  }
}
