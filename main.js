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

    let mediaPlayerPath = null;

    for (const [path, interfaces] of Object.entries(objects)) {
      // Statut réel de connexion
      if (interfaces['org.bluez.Device1']) {
        const deviceIface = interfaces['org.bluez.Device1'];
        const deviceObj = await systemBus.getProxyObject('org.bluez', path);
        const props = deviceObj.getInterface('org.freedesktop.DBus.Properties');

        // Statut initial
        mainWindow.webContents.send(
          'bt-status',
          deviceIface.Connected ? 'connecté' : 'déconnecté'
        );

        // Écoute des changements
        props.on('PropertiesChanged', (iface, changed) => {
          if (iface !== 'org.bluez.Device1') return;
          if (changed.Connected !== undefined) {
            mainWindow.webContents.send(
              'bt-status',
              changed.Connected ? 'connecté' : 'déconnecté'
            );
          }
        });
      }

      // Pour les métadonnées audio
      if (interfaces['org.bluez.MediaPlayer1'] && !mediaPlayerPath) {
        mediaPlayerPath = path;
        const playerObj = await systemBus.getProxyObject('org.bluez', path);
        const playerProps = playerObj.getInterface('org.freedesktop.DBus.Properties');

        // Écoute des changements de métadonnées
        playerProps.on('PropertiesChanged', (iface, changed) => {
          if (iface !== 'org.bluez.MediaPlayer1') return;
          if (changed.Metadata) {
            const meta = changed.Metadata;
            const title = meta['xesam:title']?.value || 'Titre inconnu';
            const artist = meta['xesam:artist']?.value?.[0] || 'Artiste inconnu';
            const album = meta['xesam:album']?.value || '';
            mainWindow.webContents.send('bt-meta', { title, artist, album });
          }
        });
      }
    }
  } catch (err) {
    console.error('Erreur Bluetooth :', err);
  }
}
