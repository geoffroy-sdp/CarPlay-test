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

// Utilitaire de simulation (pratique pour dev sous Windows)
ipcMain.handle('bt-simulate', async (event) => {
  if (!mainWindow) return;
  // envoie un statut connecté et des métadonnées factices
  mainWindow.webContents.send('bt-status', 'connecté (simulation)');
  mainWindow.webContents.send('bt-meta', {
    title: 'Titre de test',
    artist: 'Artiste de test',
    album: 'Album test',
    artwork: []
  });
  return 'simulé';
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

    // helper: unwrap dbus-next Variant objects recursively
    const unwrap = (v) => {
      if (v && typeof v === 'object' && 'value' in v) {
        return unwrap(v.value);
      }
      if (Array.isArray(v)) return v.map(unwrap);
      if (v && typeof v === 'object') {
        const out = {};
        for (const [k, val] of Object.entries(v)) out[k] = unwrap(val);
        return out;
      }
      return v;
    };

    for (const [path, interfaces] of Object.entries(objects)) {
      // Statut réel de connexion (Device1)
      if (interfaces['org.bluez.Device1']) {
        const deviceProps = interfaces['org.bluez.Device1'];
        const deviceObj = await systemBus.getProxyObject('org.bluez', path);
        const props = deviceObj.getInterface('org.freedesktop.DBus.Properties');

        const connected = unwrap(deviceProps.Connected);

        // Statut initial
        mainWindow.webContents.send('bt-status', connected ? 'connecté' : 'déconnecté');

        // Écoute des changements
        props.on('PropertiesChanged', (iface, changed) => {
          if (iface !== 'org.bluez.Device1') return;
          if (changed.Connected !== undefined) {
            const val = unwrap(changed.Connected);
            mainWindow.webContents.send('bt-status', val ? 'connecté' : 'déconnecté');
          }
        });
      }

      // Pour les métadonnées audio (MediaPlayer1 ou MediaControl1)
      if ((interfaces['org.bluez.MediaPlayer1'] || interfaces['org.bluez.MediaControl1']) && !mediaPlayerPath) {
        mediaPlayerPath = path;
        const playerObj = await systemBus.getProxyObject('org.bluez', path);
        const playerProps = playerObj.getInterface('org.freedesktop.DBus.Properties');

        // Envoi des métadonnées initiales si présentes
        try {
          const allProps = await playerProps.GetAll('org.bluez.MediaPlayer1');
          if ('Metadata' in allProps) {
            const meta = unwrap(allProps.Metadata);
            const title = (meta['xesam:title'] && (Array.isArray(meta['xesam:title']) ? meta['xesam:title'][0] : meta['xesam:title'])) || 'Titre inconnu';
            const artist = (meta['xesam:artist'] && meta['xesam:artist'][0]) || 'Artiste inconnu';
            const album = meta['xesam:album'] || '';
            mainWindow.webContents.send('bt-meta', { title, artist, album });
          } else {
            console.warn('Metadata non disponible sur cet appareil');
          }
        } catch (e) {
          console.error('Erreur lors de la récupération des métadonnées :', e);
        }

        // Écoute des changements de métadonnées
        playerProps.on('PropertiesChanged', (iface, changed) => {
          if (iface !== 'org.bluez.MediaPlayer1' && iface !== 'org.bluez.MediaControl1') return;
          if (changed.Metadata !== undefined) {
            const meta = unwrap(changed.Metadata);
            const title = (meta['xesam:title'] && (Array.isArray(meta['xesam:title']) ? meta['xesam:title'][0] : meta['xesam:title'])) || 'Titre inconnu';
            const artist = (meta['xesam:artist'] && meta['xesam:artist'][0]) || 'Artiste inconnu';
            const album = meta['xesam:album'] || '';
            mainWindow.webContents.send('bt-meta', { title, artist, album });
          } else {
            console.warn('Changement détecté mais pas de Metadata');
          }
        });
      }
    }
  } catch (err) {
    console.error('Erreur Bluetooth :', err);
  }
}
