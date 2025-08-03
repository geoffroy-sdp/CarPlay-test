class CarPlayInterface {
    constructor() {
        this.currentApp = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateConnectionStatus();
        console.log('CarPlay Interface initialisée');
    }

    setupEventListeners() {
        // Gestionnaire pour les boutons d'applications
        document.querySelectorAll('.app-button').forEach(button => {
            button.addEventListener('click', (e) => this.handleAppClick(e));
            button.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            button.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        });

        // Gestionnaire pour les touches clavier (navigation alternative)
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    handleAppClick(event) {
        const button = event.currentTarget;
        const app = button.dataset.app;
        
        this.createRippleEffect(event, button);
        this.launchApp(app);
    }

    handleTouchStart(event) {
        const button = event.currentTarget;
        button.classList.add('pressed');
        
        // Vibration tactile (si supportée)
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    handleTouchEnd(event) {
        const button = event.currentTarget;
        
        setTimeout(() => {
            button.classList.remove('pressed');
        }, 150);
    }

    createRippleEffect(event, button) {
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    launchApp(appName) {
        console.log(`Lancement de l'application: ${appName}`);
        this.currentApp = appName;

        // Simulation du lancement d'application
        switch(appName) {
            case 'music':
                this.showAppLaunch('Musique', '#FF2D55');
                // Ici, vous pourrez intégrer votre lecteur de musique
                break;
            case 'gps':
                this.showAppLaunch('GPS', '#30D158');
                // Ici, vous pourrez intégrer votre système GPS
                break;
            case 'settings':
                this.showAppLaunch('Settings', '#8E8E93');
                // Ici, vous pourrez intégrer vos paramètres
                break;
        }
    }

    showAppLaunch(appName, color) {
        // Création d'un overlay de lancement temporaire
        const overlay = document.createElement('div');
        overlay.className = 'launch-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, ${color}20, ${color}10);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
                <div style="font-size: 24px; font-weight: 600;">Ouverture de ${appName}...</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }, 1500);
    }

    handleKeydown(event) {
        // Navigation clavier pour accessibilité
        const buttons = document.querySelectorAll('.app-button');
        const currentFocus = document.activeElement;
        const currentIndex = Array.from(buttons).indexOf(currentFocus);
        
        switch(event.key) {
            case 'ArrowRight':
                event.preventDefault();
                const nextIndex = (currentIndex + 1) % buttons.length;
                buttons[nextIndex].focus();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
                buttons[prevIndex].focus();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (currentFocus && currentFocus.classList.contains('app-button')) {
                    currentFocus.click();
                }
                break;
        }
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        const isOnline = navigator.onLine;
        
        if (isOnline) {
            statusElement.innerHTML = `
                <div class="status-dot" style="background: #30D158;"></div>
                <span>Connecté</span>
            `;
        } else {
            statusElement.innerHTML = `
                <div class="status-dot" style="background: #FF3B30;"></div>
                <span>Hors ligne</span>
            `;
        }
    }
}

// Styles d'animation supplémentaires
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialisation de l'interface
document.addEventListener('DOMContentLoaded', () => {
    window.carPlayInterface = new CarPlayInterface();
});

// Gestionnaire d'événements pour la connexion réseau
window.addEventListener('online', () => {
    window.carPlayInterface?.updateConnectionStatus();
});

window.addEventListener('offline', () => {
    window.carPlayInterface?.updateConnectionStatus();
});