const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
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


// --- Bluetooth pairing / connection ---
ipcMain.handle('bluetooth-connect', async () => {
win.webContents.send('bt-status', '🔍 Recherche d’appareils Bluetooth...');


const bt = spawn('bash', ['-c', `bluetoothctl << EOF\npower on\nagent on\ndefault-agent\nscan on\nEOF`]);


bt.stdout.on('data', data => {
const line = data.toString();
if (line.includes('Device')) {
win.webContents.send('bt-status', '📱 Appareil détecté : ' + line.split('Device')[1]);
}
if (line.includes('Connected: yes')) {
win.webContents.send('bt-status', '✅ Connecté avec succès !');
listenBluetoothMetadata();
}
});


bt.stderr.on('data', data => console.error('Bluetooth error:', data.toString()));
});


// --- Lecture des métadonnées audio via DBus ---
async function listenBluetoothMetadata() {
try {
const bus = new DBus().getBus('system');
const bluez = await bus.getProxyObject('org.bluez', '/');


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