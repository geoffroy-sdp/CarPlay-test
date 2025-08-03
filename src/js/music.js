class MusicManager {
    constructor() {
        this.currentService = null;
        this.bluetoothConnected = false;
        this.currentTrack = {
            title: 'Aucun morceau',
            artist: 'Connectez un appareil Bluetooth'
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initBluetoothMonitoring();
        console.log('Music Manager initialisé');
    }

    setupEventListeners() {
        // Gestionnaires pour les boutons de service musical
        document.querySelectorAll('.music-option-button').forEach(button => {
            button.addEventListener('click', (e) => this.handleMusicServiceClick(e));
        });

        // Gestionnaire pour fermer la webview
        const closeWebview = document.getElementById('closeWebview');
        if (closeWebview) {
            closeWebview.addEventListener('click', () => this.closeWebview());
        }
    }

    handleMusicServiceClick(event) {
        const button = event.currentTarget;
        const service = button.dataset.music;
        
        console.log(`Service musical sélectionné: ${service}`);
        this.currentService = service;

        switch(service) {
            case 'spotify':
                this.openSpotify();
                break;
            case 'youtube':
                this.openYouTubeMusic();
                break;
            case 'bluetooth':
                this.showBluetoothPlayer();
                break;
        }
    }

    openSpotify() {
        console.log('Ouverture de Spotify');
        this.showWebview('https://open.spotify.com');
        this.addLog('audio', 'Spotify ouvert dans Chromium');
    }

    openYouTubeMusic() {
        console.log('Ouverture de YouTube Music');
        this.showWebview('https://music.youtube.com');
        this.addLog('audio', 'YouTube Music ouvert dans Chromium');
    }

    showWebview(url) {
        const webviewContainer = document.getElementById('webviewContainer');
        const webview = document.getElementById('musicWebview');
        
        if (webview && webviewContainer) {
            webview.src = url;
            webviewContainer.style.display = 'block';
            
            // Animation d'entrée
            webviewContainer.style.opacity = '0';
            webviewContainer.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                webviewContainer.style.transition = 'all 0.3s ease';
                webviewContainer.style.opacity = '1';
                webviewContainer.style.transform = 'translateY(0)';
            }, 10);
        }
    }

    closeWebview() {
        const webviewContainer = document.getElementById('webviewContainer');
        const webview = document.getElementById('musicWebview');
        
        if (webviewContainer) {
            webviewContainer.style.transition = 'all 0.3s ease';
            webviewContainer.style.opacity = '0';
            webviewContainer.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                webviewContainer.style.display = 'none';
                if (webview) {
                    webview.src = '';
                }
            }, 300);
        }
        
        this.addLog('audio', `${this.currentService} fermé`);
    }

    showBluetoothPlayer() {
        console.log('Affichage du lecteur Bluetooth');
        const bluetoothPlayer = document.getElementById('bluetoothPlayer');
        
        if (bluetoothPlayer) {
            bluetoothPlayer.style.display = 'block';
            bluetoothPlayer.style.opacity = '0';
            bluetoothPlayer.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                bluetoothPlayer.style.transition = 'all 0.3s ease';
                bluetoothPlayer.style.opacity = '1';
                bluetoothPlayer.style.transform = 'translateY(0)';
            }, 10);
        }
        
        this.updateBluetoothStatus();
        this.addLog('audio', 'Lecteur Bluetooth affiché');
    }

    initBluetoothMonitoring() {
        // Simulation de la surveillance Bluetooth
        this.checkBluetoothStatus();
        
        // Vérification périodique du statut Bluetooth
        setInterval(() => {
            this.checkBluetoothStatus();
        }, 5000);
    }

    checkBluetoothStatus() {
        // Simulation - Dans la vraie implémentation, ceci communiquerait avec le backend Python
        // pour obtenir le statut réel du Bluetooth A2DP
        
        // Simulation aléatoire de connexion/déconnexion pour la démo
        if (Math.random() > 0.7 && !this.bluetoothConnected) {
            this.simulateBluetoothConnection();
        } else if (Math.random() > 0.9 && this.bluetoothConnected) {
            this.simulateBluetoothDisconnection();
        }
    }

    simulateBluetoothConnection() {
        this.bluetoothConnected = true;
        this.currentTrack = {
            title: 'Exemple de Titre',
            artist: 'Artiste Exemple'
        };
        
        this.updateBluetoothStatus();
        this.addLog('audio', 'Appareil Bluetooth connecté');
        this.addLog('audio', 'A2DP Sink activé - Audio redirigé vers jack');
    }

    simulateBluetoothDisconnection() {
        this.bluetoothConnected = false;
        this.currentTrack = {
            title: 'Aucun morceau',
            artist: 'Connectez un appareil Bluetooth'
        };
        
        this.updateBluetoothStatus();
        this.addLog('audio', 'Appareil Bluetooth déconnecté');
    }

    updateBluetoothStatus() {
        const trackTitle = document.getElementById('trackTitle');
        const trackArtist = document.getElementById('trackArtist');
        const bluetoothStatus = document.getElementById('bluetoothStatus');
        
        if (trackTitle) {
            trackTitle.textContent = this.currentTrack.title;
        }
        
        if (trackArtist) {
            trackArtist.textContent = this.currentTrack.artist;
        }
        
        if (bluetoothStatus) {
            const statusIndicator = bluetoothStatus.querySelector('.status-indicator');
            const statusText = bluetoothStatus.querySelector('span');
            
            if (this.bluetoothConnected) {
                statusIndicator.classList.remove('disconnected');
                statusIndicator.classList.add('connected');
                statusText.textContent = 'Connecté';
            } else {
                statusIndicator.classList.remove('connected');
                statusIndicator.classList.add('disconnected');
                statusText.textContent = 'Déconnecté';
            }
        }
    }

    // Méthode pour recevoir les données du backend Python
    updateTrackInfo(trackData) {
        if (trackData && trackData.title && trackData.artist) {
            this.currentTrack = {
                title: trackData.title,
                artist: trackData.artist
            };
            this.updateBluetoothStatus();
            this.addLog('audio', `Nouveau morceau: ${trackData.title} - ${trackData.artist}`);
        }
    }

    // Méthode pour configurer PulseAudio A2DP Sink
    configureA2DPSink() {
        // Cette méthode sera appelée par le backend Python
        this.addLog('audio', 'Configuration A2DP Sink en cours...');
        this.addLog('audio', 'Redirection audio Bluetooth -> Jack configurée');
    }

    addLog(type, message) {
        // Ajouter un log dans la section appropriée
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            time: timestamp,
            message: message
        };

        // Envoyer le log au gestionnaire de settings
        if (window.settingsManager) {
            window.settingsManager.addLog(type, logEntry);
        }
    }
}

// Initialisation du gestionnaire de musique
document.addEventListener('DOMContentLoaded', () => {
    window.musicManager = new MusicManager();
});