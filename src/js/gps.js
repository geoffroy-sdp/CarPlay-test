class GPSManager {
    constructor() {
        this.phoneIP = null;
        this.connected = false;
        this.gpsData = {
            latitude: null,
            longitude: null,
            speed: null,
            altitude: null
        };
        this.scanInterval = null;
        this.dataInterval = null;
        this.init();
    }

    init() {
        this.startPhoneDetection();
        this.updateGPSDisplay();
        console.log('GPS Manager initialisé');
    }

    startPhoneDetection() {
        console.log('Démarrage de la détection du téléphone...');
        this.addLog('gps', 'Scan réseau démarré pour détecter le téléphone');
        
        // Simulation de la détection d'IP
        this.scanInterval = setInterval(() => {
            this.scanForPhone();
        }, 3000);
    }

    scanForPhone() {
        // Simulation du scan réseau pour trouver le téléphone
        // Dans la vraie implémentation, ceci communiquerait avec le backend Python
        
        if (!this.connected && Math.random() > 0.6) {
            // Simulation de détection d'IP
            const simulatedIP = `192.168.43.${Math.floor(Math.random() * 50) + 100}`;
            this.detectPhone(simulatedIP);
        }
    }

    detectPhone(ip) {
        this.phoneIP = ip;
        this.addLog('gps', `Téléphone détecté à l'adresse: ${ip}`);
        this.updatePhoneIPDisplay();
        
        // Tentative de connexion au port 8080
        this.connectToPhone();
    }

    connectToPhone() {
        if (!this.phoneIP) return;
        
        console.log(`Tentative de connexion à ${this.phoneIP}:8080`);
        this.addLog('gps', `Connexion au port 8080 sur ${this.phoneIP}...`);
        
        // Simulation de connexion
        setTimeout(() => {
            if (Math.random() > 0.3) {
                this.onConnectionSuccess();
            } else {
                this.onConnectionFailed();
            }
        }, 2000);
    }

    onConnectionSuccess() {
        this.connected = true;
        clearInterval(this.scanInterval);
        
        this.updateConnectionStatus(true);
        this.addLog('gps', 'Connexion GPS établie avec succès');
        this.addLog('gps', 'Réception des données GPS en cours...');
        
        // Démarrer la réception des données GPS
        this.startGPSDataReception();
    }

    onConnectionFailed() {
        this.addLog('gps', 'Échec de connexion au port 8080');
        this.addLog('gps', 'Nouvelle tentative dans 5 secondes...');
        
        setTimeout(() => {
            if (!this.connected) {
                this.connectToPhone();
            }
        }, 5000);
    }

    startGPSDataReception() {
        // Simulation de réception de données GPS
        this.dataInterval = setInterval(() => {
            this.receiveGPSData();
        }, 1000);
    }

    receiveGPSData() {
        // Simulation de données GPS réalistes
        const baseLatitude = 48.8566; // Paris
        const baseLongitude = 2.3522;
        
        this.gpsData = {
            latitude: (baseLatitude + (Math.random() - 0.5) * 0.01).toFixed(6),
            longitude: (baseLongitude + (Math.random() - 0.5) * 0.01).toFixed(6),
            speed: Math.floor(Math.random() * 120),
            altitude: Math.floor(Math.random() * 200) + 50
        };
        
        this.updateGPSDisplay();
        
        // Log périodique des données
        if (Math.random() > 0.9) {
            this.addLog('gps', `Position: ${this.gpsData.latitude}, ${this.gpsData.longitude}`);
        }
    }

    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('gpsStatusDot');
        const statusText = document.getElementById('gpsStatusText');
        
        if (statusDot && statusText) {
            if (connected) {
                statusDot.classList.remove('disconnected');
                statusDot.classList.add('connected');
                statusText.textContent = 'Connecté au téléphone';
            } else {
                statusDot.classList.remove('connected');
                statusDot.classList.add('disconnected');
                statusText.textContent = 'Recherche du téléphone...';
            }
        }
    }

    updatePhoneIPDisplay() {
        const phoneIPElement = document.getElementById('phoneIP');
        if (phoneIPElement && this.phoneIP) {
            phoneIPElement.textContent = `IP: ${this.phoneIP}`;
        }
    }

    updateGPSDisplay() {
        const elements = {
            latitude: document.getElementById('latitude'),
            longitude: document.getElementById('longitude'),
            speed: document.getElementById('speed'),
            altitude: document.getElementById('altitude')
        };
        
        if (elements.latitude) {
            elements.latitude.textContent = this.gpsData.latitude || '--';
        }
        
        if (elements.longitude) {
            elements.longitude.textContent = this.gpsData.longitude || '--';
        }
        
        if (elements.speed) {
            elements.speed.textContent = this.gpsData.speed ? `${this.gpsData.speed} km/h` : '-- km/h';
        }
        
        if (elements.altitude) {
            elements.altitude.textContent = this.gpsData.altitude ? `${this.gpsData.altitude} m` : '-- m';
        }
    }

    // Méthode pour recevoir des données du backend Python
    updateGPSFromBackend(data) {
        if (data) {
            this.gpsData = {
                latitude: data.latitude?.toFixed(6) || this.gpsData.latitude,
                longitude: data.longitude?.toFixed(6) || this.gpsData.longitude,
                speed: Math.round(data.speed) || this.gpsData.speed,
                altitude: Math.round(data.altitude) || this.gpsData.altitude
            };
            
            this.updateGPSDisplay();
        }
    }

    // Méthode pour définir manuellement l'IP du téléphone
    setPhoneIP(ip) {
        this.phoneIP = ip;
        this.updatePhoneIPDisplay();
        this.connectToPhone();
        this.addLog('gps', `IP du téléphone définie manuellement: ${ip}`);
    }

    // Méthode pour redémarrer la détection
    restartDetection() {
        this.disconnect();
        this.startPhoneDetection();
        this.addLog('gps', 'Redémarrage de la détection GPS');
    }

    disconnect() {
        this.connected = false;
        this.phoneIP = null;
        
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }
        
        if (this.dataInterval) {
            clearInterval(this.dataInterval);
        }
        
        this.gpsData = {
            latitude: null,
            longitude: null,
            speed: null,
            altitude: null
        };
        
        this.updateConnectionStatus(false);
        this.updateGPSDisplay();
        this.updatePhoneIPDisplay();
        
        this.addLog('gps', 'Connexion GPS fermée');
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

// Initialisation du gestionnaire GPS
document.addEventListener('DOMContentLoaded', () => {
    window.gpsManager = new GPSManager();
});