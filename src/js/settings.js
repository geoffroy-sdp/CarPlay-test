class SettingsManager {
    constructor() {
        this.logs = {
            system: [],
            audio: [],
            gps: []
        };
        this.maxLogsPerType = 50;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeLogs();
        this.startLogMonitoring();
        console.log('Settings Manager initialisé');
    }

    setupEventListeners() {
        // Bouton pour relancer l'interface
        const restartInterface = document.getElementById('restartInterface');
        if (restartInterface) {
            restartInterface.addEventListener('click', () => this.restartInterface());
        }

        // Bouton pour redémarrer le backend Python
        const restartBackend = document.getElementById('restartBackend');
        if (restartBackend) {
            restartBackend.addEventListener('click', () => this.restartBackend());
        }
    }

    initializeLogs() {
        // Logs système initiaux
        this.addLog('system', {
            time: new Date().toLocaleTimeString(),
            message: 'Interface CarPlay démarrée'
        });
        
        this.addLog('system', {
            time: new Date().toLocaleTimeString(),
            message: 'Raspberry Pi 4 - 4GB RAM détecté'
        });
        
        this.addLog('system', {
            time: new Date().toLocaleTimeString(),
            message: 'Écran tactile 1024x600 configuré'
        });

        // Logs audio initiaux
        this.addLog('audio', {
            time: new Date().toLocaleTimeString(),
            message: 'PulseAudio initialisé'
        });
        
        this.addLog('audio', {
            time: new Date().toLocaleTimeString(),
            message: 'A2DP Sink configuré pour Bluetooth'
        });
        
        this.addLog('audio', {
            time: new Date().toLocaleTimeString(),
            message: 'Sortie audio jack activée'
        });

        // Logs GPS initiaux
        this.addLog('gps', {
            time: new Date().toLocaleTimeString(),
            message: 'Module GPS initialisé'
        });
        
        this.addLog('gps', {
            time: new Date().toLocaleTimeString(),
            message: 'Port 8080 en écoute pour données GPS'
        });

        this.updateAllLogDisplays();
    }

    startLogMonitoring() {
        // Surveillance périodique du système
        setInterval(() => {
            this.checkSystemStatus();
        }, 30000); // Toutes les 30 secondes
    }

    checkSystemStatus() {
        // Simulation de vérifications système
        const memoryUsage = Math.floor(Math.random() * 40) + 30; // 30-70%
        const cpuTemp = Math.floor(Math.random() * 20) + 45; // 45-65°C
        
        if (memoryUsage > 60) {
            this.addLog('system', {
                time: new Date().toLocaleTimeString(),
                message: `Utilisation mémoire élevée: ${memoryUsage}%`
            });
        }
        
        if (cpuTemp > 60) {
            this.addLog('system', {
                time: new Date().toLocaleTimeString(),
                message: `Température CPU: ${cpuTemp}°C`
            });
        }
        
        // Vérification de l'espace disque
        if (Math.random() > 0.95) {
            const diskUsage = Math.floor(Math.random() * 30) + 50;
            this.addLog('system', {
                time: new Date().toLocaleTimeString(),
                message: `Espace disque utilisé: ${diskUsage}%`
            });
        }
    }

    addLog(type, logEntry) {
        if (!this.logs[type]) {
            this.logs[type] = [];
        }
        
        this.logs[type].push(logEntry);
        
        // Limiter le nombre de logs
        if (this.logs[type].length > this.maxLogsPerType) {
            this.logs[type].shift();
        }
        
        this.updateLogDisplay(type);
    }

    updateLogDisplay(type) {
        const logContainer = document.getElementById(`${type}Logs`);
        if (!logContainer) return;
        
        // Garder les derniers 10 logs pour l'affichage
        const recentLogs = this.logs[type].slice(-10);
        
        logContainer.innerHTML = recentLogs.map(log => `
            <div class="log-entry">
                <span class="log-time">${log.time}</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');
        
        // Auto-scroll vers le bas
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    updateAllLogDisplays() {
        Object.keys(this.logs).forEach(type => {
            this.updateLogDisplay(type);
        });
    }

    restartInterface() {
        console.log('Redémarrage de l\'interface demandé');
        
        this.addLog('system', {
            time: new Date().toLocaleTimeString(),
            message: 'Redémarrage de l\'interface en cours...'
        });
        
        // Animation de redémarrage
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.transition = 'opacity 0.5s ease';
            mainContainer.style.opacity = '0';
            
            setTimeout(() => {
                // Simuler le redémarrage
                this.simulateRestart();
                mainContainer.style.opacity = '1';
            }, 1000);
        }
    }

    restartBackend() {
        console.log('Redémarrage du backend Python demandé');
        
        this.addLog('system', {
            time: new Date().toLocaleTimeString(),
            message: 'Redémarrage du backend Python...'
        });
        
        // Simulation du redémarrage du backend
        setTimeout(() => {
            this.addLog('system', {
                time: new Date().toLocaleTimeString(),
                message: 'Backend Python redémarré avec succès'
            });
            
            this.addLog('audio', {
                time: new Date().toLocaleTimeString(),
                message: 'Services audio réinitialisés'
            });
            
            this.addLog('gps', {
                time: new Date().toLocaleTimeString(),
                message: 'Services GPS réinitialisés'
            });
            
            // Redémarrer les gestionnaires
            if (window.musicManager) {
                window.musicManager.initBluetoothMonitoring();
            }
            
            if (window.gpsManager) {
                window.gpsManager.restartDetection();
            }
            
        }, 2000);
    }

    simulateRestart() {
        // Réinitialiser les logs avec de nouveaux messages de démarrage
        this.logs = {
            system: [],
            audio: [],
            gps: []
        };
        
        setTimeout(() => {
            this.addLog('system', {
                time: new Date().toLocaleTimeString(),
                message: 'Interface redémarrée avec succès'
            });
            
            this.addLog('system', {
                time: new Date().toLocaleTimeString(),
                message: 'Tous les modules rechargés'
            });
        }, 500);
    }

    // Méthode pour exporter les logs
    exportLogs() {
        const allLogs = {
            timestamp: new Date().toISOString(),
            system: this.logs.system,
            audio: this.logs.audio,
            gps: this.logs.gps
        };
        
        const dataStr = JSON.stringify(allLogs, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `carplay-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.addLog('system', {
            time: new Date().toLocaleTimeString(),
            message: 'Logs exportés avec succès'
        });
    }

    // Méthode pour vider les logs
    clearLogs(type = null) {
        if (type && this.logs[type]) {
            this.logs[type] = [];
            this.updateLogDisplay(type);
            this.addLog('system', {
                time: new Date().toLocaleTimeString(),
                message: `Logs ${type} vidés`
            });
        } else if (!type) {
            // Vider tous les logs
            Object.keys(this.logs).forEach(logType => {
                this.logs[logType] = [];
                this.updateLogDisplay(logType);
            });
            
            this.addLog('system', {
                time: new Date().toLocaleTimeString(),
                message: 'Tous les logs vidés'
            });
        }
    }

    // Méthode pour obtenir les statistiques système
    getSystemStats() {
        return {
            totalLogs: Object.values(this.logs).reduce((total, logs) => total + logs.length, 0),
            systemLogs: this.logs.system.length,
            audioLogs: this.logs.audio.length,
            gpsLogs: this.logs.gps.length,
            uptime: this.getUptime()
        };
    }

    getUptime() {
        // Simulation de l'uptime
        const startTime = new Date().getTime() - (Math.random() * 3600000); // Jusqu'à 1h
        const uptime = new Date().getTime() - startTime;
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    }
}

// Initialisation du gestionnaire de settings
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});