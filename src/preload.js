const { contextBridge, ipcRenderer } = require('electron');

// Exposition sécurisée des APIs Electron au renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Méthodes pour la gestion des applications
    openApp: (appName) => ipcRenderer.invoke('open-app', appName),
    closeApp: () => ipcRenderer.invoke('close-app'),
    
    // Méthodes pour les paramètres système
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
    
    // Méthodes pour la gestion de l'alimentation
    shutdown: () => ipcRenderer.invoke('shutdown'),
    reboot: () => ipcRenderer.invoke('reboot'),
    
    // Listeners pour les événements système
    onSystemEvent: (callback) => ipcRenderer.on('system-event', callback),
    removeSystemEventListener: () => ipcRenderer.removeAllListeners('system-event')
});