class PersistentControlsManager {
    constructor() {
        this.isPlaying = false;
        this.currentVolume = 50;
        this.currentApp = 'home';
        this.cpuTemp = 45;
        this.connectionStates = {
            wifi: false,
            bluetooth: false,
            gps: 'disconnected' // disconnected, poor, fair, good, excellent
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startSystemMonitoring();
        this.updateConnectionStates();
        this.updateCurrentApp();
        console.log('Persistent Controls Manager initialisé');
    }

    setupEventListeners() {
        // Contrôles audio
        const playPause = document.getElementById('playPause');
        const prevTrack = document.getElementById('prevTrack');
        const nextTrack = document.getElementById('nextTrack');
        const volumeSlider = document.getElementById('volumeSlider');

        if (playPause) {
            playPause.addEventListener('click', () => this.togglePlayPause());
        }

        if (prevTrack) {
            prevTrack.addEventListener('click', () => this.previousTrack());
        }

        if (nextTrack) {
            nextTrack.addEventListener('click', () => this.nextTrack());
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.changeVolume(e.target.value));
        }

        // Boutons utilitaires
        const homeButton = document.getElementById('homeButton');
        const keyboardButton = document.getElementById('keyboardButton');

        if (homeButton) {
            homeButton.addEventListener('click', () => this.goHome());
        }

        if (keyboardButton) {
            keyboardButton.addEventListener('click', () => this.toggleKeyboard());
        }

        // Clavier virtuel
        this.setupVirtualKeyboard();

        // Écouter les changements d'application
        document.addEventListener('appChanged', (e) => {
            this.setCurrentApp(e.detail.app);
        });
    }

    setupVirtualKeyboard() {
        const closeKeyboard = document.getElementById('closeKeyboard');
        const virtualKeyboard = document.getElementById('virtualKeyboard');

        if (closeKeyboard) {
            closeKeyboard.addEventListener('click', () => this.hideKeyboard());
        }

        // Gestion des touches du clavier
        if (virtualKeyboard) {
            const keys = virtualKeyboard.querySelectorAll('.key');
            keys.forEach(key => {
                key.addEventListener('click', () => this.handleKeyPress(key));
            });
        }
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        const playPauseBtn = document.getElementById('playPause');
        const icon = playPauseBtn.querySelector('i');
        
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
            playPauseBtn.classList.add('playing');
            this.addLog('audio', 'Lecture démarrée');
        } else {
            icon.className = 'fas fa-play';
            playPauseBtn.classList.remove('playing');
            this.addLog('audio', 'Lecture mise en pause');
        }

        // Envoyer la commande au backend pour contrôler la musique
        this.sendAudioCommand('toggle');
    }

    previousTrack() {
        console.log('Piste précédente');
        this.addLog('audio', 'Piste précédente');
        this.sendAudioCommand('previous');
    }

    nextTrack() {
        console.log('Piste suivante');
        this.addLog('audio', 'Piste suivante');
        this.sendAudioCommand('next');
    }

    changeVolume(volume) {
        this.currentVolume = parseInt(volume);
        console.log(`Volume changé: ${this.currentVolume}%`);
        
        // Mettre à jour l'affichage du volume
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.value = this.currentVolume;
        }

        // Envoyer la commande au backend pour changer le volume PulseAudio
        this.sendAudioCommand('volume', { level: this.currentVolume });
        
        if (this.currentVolume % 10 === 0) { // Log seulement tous les 10%
            this.addLog('audio', `Volume: ${this.currentVolume}%`);
        }
    }

    sendAudioCommand(command, data = {}) {
        // Cette méthode sera utilisée pour communiquer avec le backend Python
        // pour contrôler PulseAudio et router l'audio vers la prise jack
        const audioCommand = {
            command: command,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        console.log('Commande audio envoyée:', audioCommand);
        
        // Ici, vous ajouterez la communication avec le backend Python
        // Par exemple via WebSocket ou API REST
    }

    goHome() {
        console.log('Retour à l\'accueil');
        if (window.carPlayInterface) {
            window.carPlayInterface.showScreen('home');
        }
        this.setCurrentApp('home');
    }

    toggleKeyboard() {
        const keyboard = document.getElementById('virtualKeyboard');
        if (keyboard) {
            if (keyboard.style.display === 'none' || !keyboard.style.display) {
                this.showKeyboard();
            } else {
                this.hideKeyboard();
            }
        }
    }

    showKeyboard() {
        const keyboard = document.getElementById('virtualKeyboard');
        if (keyboard) {
            keyboard.style.display = 'block';
            this.addLog('system', 'Clavier virtuel affiché');
        }
    }

    hideKeyboard() {
        const keyboard = document.getElementById('virtualKeyboard');
        if (keyboard) {
            keyboard.style.display = 'none';
            this.addLog('system', 'Clavier virtuel masqué');
        }
    }

    handleKeyPress(keyElement) {
        const keyText = keyElement.textContent;
        
        if (keyElement.classList.contains('space')) {
            this.typeCharacter(' ');
        } else if (keyElement.classList.contains('backspace')) {
            this.handleBackspace();
        } else if (keyElement.classList.contains('enter')) {
            this.handleEnter();
        } else {
            this.typeCharacter(keyText);
        }
    }

    typeCharacter(char) {
        // Envoyer le caractère à l'élément actuellement focalisé
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const value = activeElement.value;
            
            activeElement.value = value.substring(0, start) + char + value.substring(end);
            activeElement.selectionStart = activeElement.selectionEnd = start + char.length;
            
            // Déclencher l'événement input
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    handleBackspace() {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const value = activeElement.value;
            
            if (start === end && start > 0) {
                activeElement.value = value.substring(0, start - 1) + value.substring(end);
                activeElement.selectionStart = activeElement.selectionEnd = start - 1;
            } else if (start !== end) {
                activeElement.value = value.substring(0, start) + value.substring(end);
                activeElement.selectionStart = activeElement.selectionEnd = start;
            }
            
            activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    handleEnter() {
        const activeElement = document.activeElement;
        if (activeElement) {
            // Déclencher l'événement keydown avec Enter
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                bubbles: true
            });
            activeElement.dispatchEvent(enterEvent);
        }
    }

    setCurrentApp(appName) {
        this.currentApp = appName;
        this.updateCurrentApp();
        
        // Émettre un événement pour notifier le changement
        document.dispatchEvent(new CustomEvent('appChanged', {
            detail: { app: appName }
        }));
    }

    updateCurrentApp() {
        const appNameElement = document.getElementById('appName');
        const appIcon = document.querySelector('.current-app i');
        
        if (appNameElement) {
            const appNames = {
                'home': 'Accueil',
                'music': 'Musique',
                'gps': 'GPS',
                'settings': 'Settings'
            };
            appNameElement.textContent = appNames[this.currentApp] || 'Inconnu';
        }
        
        if (appIcon) {
            const appIcons = {
                'home': 'fas fa-home',
                'music': 'fas fa-music',
                'gps': 'fas fa-map-marker-alt',
                'settings': 'fas fa-cog'
            };
            appIcon.className = appIcons[this.currentApp] || 'fas fa-home';
        }
    }

    startSystemMonitoring() {
        // Surveillance de la température CPU
        setInterval(() => {
            this.updateCPUTemperature();
        }, 5000);

        // Surveillance des connexions
        setInterval(() => {
            this.checkConnections();
        }, 3000);
    }

    updateCPUTemperature() {
        // Simulation de la température CPU (dans la vraie implémentation, 
        // ceci viendrait du backend Python)
        const baseTemp = 45;
        const variation = Math.random() * 20 - 10; // -10 à +10
        this.cpuTemp = Math.round(baseTemp + variation);
        
        const tempElement = document.getElementById('tempValue');
        if (tempElement) {
            tempElement.textContent = `${this.cpuTemp}°C`;
            
            // Changer la couleur selon la température
            const tempIcon = document.querySelector('.cpu-temp i');
            if (tempIcon) {
                if (this.cpuTemp > 70) {
                    tempIcon.style.color = '#FF3B30'; // Rouge
                } else if (this.cpuTemp > 60) {
                    tempIcon.style.color = '#FF9500'; // Orange
                } else {
                    tempIcon.style.color = '#30D158'; // Vert
                }
            }
        }
        
        // Log si température élevée
        if (this.cpuTemp > 65) {
            this.addLog('system', `Température CPU élevée: ${this.cpuTemp}°C`);
        }
    }

    checkConnections() {
        // Simulation des vérifications de connexion
        // Dans la vraie implémentation, ceci viendrait du backend Python
        
        // Wi-Fi
        const wasWifiConnected = this.connectionStates.wifi;
        this.connectionStates.wifi = navigator.onLine && Math.random() > 0.1;
        
        if (wasWifiConnected !== this.connectionStates.wifi) {
            this.addLog('system', `Wi-Fi ${this.connectionStates.wifi ? 'connecté' : 'déconnecté'}`);
        }
        
        // Bluetooth
        const wasBtConnected = this.connectionStates.bluetooth;
        this.connectionStates.bluetooth = Math.random() > 0.3;
        
        if (wasBtConnected !== this.connectionStates.bluetooth) {
            this.addLog('audio', `Bluetooth ${this.connectionStates.bluetooth ? 'connecté' : 'déconnecté'}`);
        }
        
        // GPS
        const gpsStates = ['disconnected', 'poor', 'fair', 'good', 'excellent'];
        const oldGpsState = this.connectionStates.gps;
        this.connectionStates.gps = gpsStates[Math.floor(Math.random() * gpsStates.length)];
        
        if (oldGpsState !== this.connectionStates.gps) {
            this.addLog('gps', `Signal GPS: ${this.connectionStates.gps}`);
        }
        
        this.updateConnectionStates();
    }

    updateConnectionStates() {
        // Wi-Fi
        const wifiStatus = document.getElementById('wifiStatus');
        if (wifiStatus) {
            wifiStatus.className = `status-item wifi-status ${this.connectionStates.wifi ? 'connected' : 'disconnected'}`;
        }
        
        // Bluetooth
        const bluetoothStatus = document.getElementById('bluetoothStatus');
        if (bluetoothStatus) {
            bluetoothStatus.className = `status-item bluetooth-status ${this.connectionStates.bluetooth ? 'connected' : 'disconnected'}`;
        }
        
        // GPS
        const gpsStatus = document.getElementById('gpsStatus');
        if (gpsStatus) {
            let statusClass = 'disconnected';
            if (this.connectionStates.gps !== 'disconnected') {
                statusClass = `signal-${this.connectionStates.gps}`;
            }
            gpsStatus.className = `status-item gps-status ${statusClass}`;
        }
    }

    // Méthodes pour recevoir des données du backend Python
    updateAudioState(audioData) {
        if (audioData.isPlaying !== undefined) {
            this.isPlaying = audioData.isPlaying;
            const playPauseBtn = document.getElementById('playPause');
            const icon = playPauseBtn.querySelector('i');
            
            if (this.isPlaying) {
                icon.className = 'fas fa-pause';
                playPauseBtn.classList.add('playing');
            } else {
                icon.className = 'fas fa-play';
                playPauseBtn.classList.remove('playing');
            }
        }
        
        if (audioData.volume !== undefined) {
            this.currentVolume = audioData.volume;
            const volumeSlider = document.getElementById('volumeSlider');
            if (volumeSlider) {
                volumeSlider.value = this.currentVolume;
            }
        }
    }

    updateSystemData(systemData) {
        if (systemData.cpuTemp !== undefined) {
            this.cpuTemp = systemData.cpuTemp;
            this.updateCPUTemperature();
        }
        
        if (systemData.connections) {
            this.connectionStates = { ...this.connectionStates, ...systemData.connections };
            this.updateConnectionStates();
        }
    }

    addLog(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            time: timestamp,
            message: message
        };

        if (window.settingsManager) {
            window.settingsManager.addLog(type, logEntry);
        }
    }
}

// Initialisation du gestionnaire de contrôles persistants
document.addEventListener('DOMContentLoaded', () => {
    window.persistentControlsManager = new PersistentControlsManager();
});

// Écouter les changements d'écran pour mettre à jour l'application courante
document.addEventListener('DOMContentLoaded', () => {
    const originalShowScreen = window.carPlayInterface?.showScreen;
    if (originalShowScreen && window.carPlayInterface) {
        window.carPlayInterface.showScreen = function(screenName) {
            originalShowScreen.call(this, screenName);
            if (window.persistentControlsManager) {
                window.persistentControlsManager.setCurrentApp(screenName);
            }
        };
    }
});