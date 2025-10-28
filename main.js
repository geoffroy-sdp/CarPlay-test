const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn, exec } = require('child_process');
const { DBus } = require('dbus-next');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 600,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// --- Fonction Bluetooth principale ---
ipcMain.handle('bluetooth-connect', async () => {
  win.webContents.send('bt-status', '🔄 Initialisation du Bluetooth...');

  // Étape 1 : Activation du Bluetooth
  exec('sudo systemctl start bluetooth', () => {
    exec('bluetoothctl << EOF\npower on\nagent on\ndefault-agent\npairable on\ndiscoverable on\nEOF', () => {
      win.webContents.send('bt-status', '📡 Bluetooth activé et détectable !');

      // Étape 2 : Accepter automatiquement les appairages
      const bt = spawn('bluetoothctl');
      bt.stdin.write('power on\nagent on\ndefault-agent\npairable on\ndiscoverable on\nscan on\n');
      bt.stdin.write('yes\n');

      bt.stdout.on('data', data => {
        const line = data.toString();
        console.log(line);

        if (line.includes('Device')) {
          win.webContents.send('bt-status', '📱 Appareil détecté : ' + line.split('Device')[1]);
        }

        if (line.includes('Paired: yes') || line.includes('Connection successful')) {
          win.webContents.send('bt-status', '✅ Connecté avec succès, configuration audio...');
          setAudioToJack();
          listenBluetoothMetadata();
        }
      });
    });
  });
});

// --- Étape 3 : Configurer l’audio sur la sortie jack ---
function setAudioToJack() {
  // Active la sortie analogique (jack)
  exec('pactl set-card-profile 0 output-analog-stereo', (err) => {
    if (err) console.error('Erreur config audio (jack):', err);
  });

  // Définit le profil Bluetooth en A2DP sink (récepteur)
  exec('pactl set-card-profile bluez_card.* a2dp_sink', (err) => {
    if (err) console.error('Erreur config audio (A2DP):', err);
  });

  win.webContents.send('bt-status', '🔊 Audio redirigé vers la prise jack !');
}

// --- Lecture des métadonnées audio via DBus ---
async function listenBluetoothMetadata() {
  try {
    const bus = new DBus().getBus('system');
    bus.addMatch("type='signal',interface='org.freedesktop.DBus.Properties'");
    bus.on('message', msg => {
      if (msg.member === 'PropertiesChanged' && msg.body[0].includes('MediaPlayer1')) {
        const props = msg.body[1];
        if (props.Metadata) {
          const meta = props.Metadata.value;
          const title = meta['xesam:title']?.value || 'Inconnu';
          const artist = meta['xesam:artist']?.value?.[0] || 'Artiste inconnu';
          win.webContents.send('bt-status', `🎶 ${artist} - ${title}`);
        }
      }
    });
  } catch (err) {
    console.error('Erreur DBus:', err);
    win.webContents.send('bt-status', '⚠️ Erreur de lecture des métadonnées');
  }
}
