const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dbus = require('dbus-next');

let mainWindow;

app.disableHardwareAcceleration();

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
      setupBluetooth(); // initialise Bluetooth après ouverture
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
    const systemBus = dbus.systemBus();
    const bluezObj = await systemBus.getProxyObject('org.bluez', '/');
    const manager = bluezObj.getInterface('org.freedesktop.DBus.ObjectManager');

    const objects = await manager.GetManagedObjects();
    // Cherche un périphérique déjà connecté
    for (let [objPath, interfaces] of Object.entries(objects)) {
      if (interfaces['org.bluez.Device1'] && interfaces['org.bluez.MediaPlayer1']) {
        const device = interfaces['org.bluez.Device1'];
        const playerIface = interfaces['org.bluez.MediaPlayer1'];

        // Connecte si pas connecté
        if (!device.Connected) {
          const devObj = await systemBus.getProxyObject('org.bluez', objPath);
          const devInterface = devObj.getInterface('org.bluez.Device1');
          await devInterface.Connect();
        }

        // Écoute les changements de métadonnées
        const playerObj = await systemBus.getProxyObject('org.bluez', objPath);
        const propertiesIface = playerObj.getInterface('org.freedesktop.DBus.Properties');

        propertiesIface.on('PropertiesChanged', (iface, changed) => {
          if (iface.includes('MediaPlayer1') && changed.Metadata) {
            const meta = changed.Metadata.value;
            const title = meta['xesam:title']?.value || 'Titre inconnu';
            const artist = meta['xesam:artist']?.value?.[0] || 'Artiste inconnu';
            const album = meta['xesam:album']?.value || '';
            mainWindow.webContents.send('bt-meta', { title, artist, album });
          }
        });
      }
    }
  } catch(err) {
    console.error('Erreur Bluetooth :', err);
    mainWindow.webContents.send('bt-meta', { title: 'Erreur', artist: '', album: '' });
  }
}
