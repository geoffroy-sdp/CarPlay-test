class TouchManager {
    constructor() {
        this.touchStartTime = 0;
        this.touchStartPosition = { x: 0, y: 0 };
        this.init();
    }

    init() {
        this.setupTouchEvents();
        this.preventDefaultBehaviors();
    }

    setupTouchEvents() {
        // Prévention du zoom tactile
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Gestion des gestes
        document.addEventListener('touchstart', (e) => {
            this.touchStartTime = Date.now();
            this.touchStartPosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        });

        document.addEventListener('touchend', (e) => {
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - this.touchStartTime;
            
            // Détection du tap long (> 500ms)
            if (touchDuration > 500) {
                this.handleLongPress(e);
            }
        });
    }

    preventDefaultBehaviors() {
        // Prévention du menu contextuel
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Prévention de la sélection de texte
        document.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });

        // Prévention du glisser-déposer
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });
    }

    handleLongPress(event) {
        console.log('Long press détecté');
        
        // Vibration pour le feedback tactile
        if (navigator.vibrate) {
            navigator.vibrate([10, 50, 10]);
        }
        
        // Ici vous pouvez ajouter des actions pour les pressions longues
        // Par exemple : afficher un menu contextuel
    }

    enableHapticFeedback() {
        // Activation du retour haptique pour les appareils compatibles
        if ('vibrate' in navigator) {
            console.log('Retour haptique activé');
            return true;
        }
        return false;
    }

    // Méthode pour calibrer la sensibilité tactile
    calibrateTouchSensitivity() {
        const buttons = document.querySelectorAll('.app-button');
        
        buttons.forEach(button => {
            // Ajustement de la zone tactile
            button.style.padding = '10px';
            button.style.margin = '5px';
        });
    }
}

// Initialisation du gestionnaire tactile
document.addEventListener('DOMContentLoaded', () => {
    window.touchManager = new TouchManager();
    window.touchManager.enableHapticFeedback();
    window.touchManager.calibrateTouchSensitivity();
});

// Optimisations pour l'écran tactile
window.addEventListener('load', () => {
    // Désactivation du zoom par défaut
    document.querySelector('meta[name="viewport"]').setAttribute(
        'content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
    );
    
    // Optimisation des performances tactiles
    document.body.style.touchAction = 'manipulation';
});