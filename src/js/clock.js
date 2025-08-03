class ClockManager {
    constructor() {
        this.timeElement = document.getElementById('timeDisplay');
        this.init();
    }

    init() {
        this.updateTime();
        this.startClock();
    }

    updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        if (this.timeElement) {
            this.timeElement.textContent = `${hours}:${minutes}`;
        }
    }

    startClock() {
        // Mise à jour chaque seconde
        setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    formatTime(date) {
        return {
            hours: String(date.getHours()).padStart(2, '0'),
            minutes: String(date.getMinutes()).padStart(2, '0'),
            seconds: String(date.getSeconds()).padStart(2, '0')
        };
    }
}

// Initialisation de l'horloge
document.addEventListener('DOMContentLoaded', () => {
    window.clockManager = new ClockManager();
});