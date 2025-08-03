#!/usr/bin/env python3
# CarPlay Interface Backend - Main Flask Application
import os
import sys
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

# Import custom modules
from modules.audio_manager import AudioManager
from modules.gps_manager import GPSManager
from modules.system_manager import SystemManager
from modules.bluetooth_manager import BluetoothManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/carplay/app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class CarPlayBackend:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)
        
        # Initialize managers
        self.audio_manager = AudioManager()
        self.gps_manager = GPSManager()
        self.system_manager = SystemManager()
        self.bluetooth_manager = BluetoothManager()
        
        self.setup_routes()
        self.setup_error_handlers()
        
    def setup_routes(self):
        """Setup all API routes"""
        
        # System routes
        @self.app.route('/api/system/status', methods=['GET'])
        def system_status():
            try:
                status = self.system_manager.get_system_status()
                return jsonify({
                    'success': True,
                    'connected': True,
                    'status': status
                })
            except Exception as e:
                logger.error(f"Erreur système status: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/system/ping', methods=['GET'])
        def ping():
            return jsonify({'success': True, 'timestamp': datetime.now().isoformat()})
        
        @self.app.route('/api/system/logs', methods=['GET'])
        def get_logs():
            try:
                logs = self.system_manager.get_logs()
                return jsonify({
                    'success': True,
                    'logs': logs
                })
            except Exception as e:
                logger.error(f"Erreur récupération logs: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/system/restart-backend', methods=['POST'])
        def restart_backend():
            try:
                self.system_manager.restart_backend()
                return jsonify({'success': True})
            except Exception as e:
                logger.error(f"Erreur redémarrage backend: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/system/chromium', methods=['POST'])
        def launch_chromium():
            try:
                data = request.get_json()
                url = data.get('url')
                width = data.get('width', 1024)
                height = data.get('height', 450)
                kiosk = data.get('kiosk', True)
                
                success = self.system_manager.launch_chromium(url, width, height, kiosk)
                return jsonify({
                    'success': success,
                    'message': 'Chromium lancé' if success else 'Erreur lancement Chromium'
                })
            except Exception as e:
                logger.error(f"Erreur lancement Chromium: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        # Audio routes
        @self.app.route('/api/audio/status', methods=['GET'])
        def audio_status():
            try:
                status = self.audio_manager.get_status()
                return jsonify({
                    'success': True,
                    'bluetooth': status
                })
            except Exception as e:
                logger.error(f"Erreur audio status: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/audio/bluetooth/init', methods=['POST'])
        def init_bluetooth():
            try:
                success = self.bluetooth_manager.initialize_a2dp()
                return jsonify({
                    'success': success,
                    'message': 'Bluetooth A2DP initialisé' if success else 'Erreur initialisation'
                })
            except Exception as e:
                logger.error(f"Erreur init Bluetooth: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/audio/bluetooth/discover', methods=['POST'])
        def bluetooth_discover():
            try:
                success = self.bluetooth_manager.enable_discovery()
                return jsonify({
                    'success': success,
                    'message': 'Mode découverte activé' if success else 'Erreur découverte'
                })
            except Exception as e:
                logger.error(f"Erreur découverte Bluetooth: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/audio/bluetooth/disconnect', methods=['POST'])
        def bluetooth_disconnect():
            try:
                success = self.bluetooth_manager.disconnect()
                return jsonify({
                    'success': success,
                    'message': 'Déconnecté' if success else 'Erreur déconnexion'
                })
            except Exception as e:
                logger.error(f"Erreur déconnexion Bluetooth: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/audio/spotify/launch', methods=['POST'])
        def launch_spotify():
            try:
                success = self.audio_manager.launch_spotify()
                return jsonify({
                    'success': success,
                    'message': 'Spotify lancé' if success else 'Erreur lancement Spotify'
                })
            except Exception as e:
                logger.error(f"Erreur lancement Spotify: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/audio/youtube/launch', methods=['POST'])
        def launch_youtube():
            try:
                success = self.audio_manager.launch_youtube_music()
                return jsonify({
                    'success': success,
                    'message': 'YouTube Music lancé' if success else 'Erreur lancement YouTube Music'
                })
            except Exception as e:
                logger.error(f"Erreur lancement YouTube Music: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        # GPS routes
        @self.app.route('/api/gps/detect-phone', methods=['GET'])
        def detect_phone():
            try:
                phone_ip = self.gps_manager.detect_phone_ip()
                return jsonify({
                    'success': phone_ip is not None,
                    'ip': phone_ip,
                    'message': f'Téléphone trouvé: {phone_ip}' if phone_ip else 'Téléphone non trouvé'
                })
            except Exception as e:
                logger.error(f"Erreur détection téléphone: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/gps/connect', methods=['POST'])
        def connect_gps():
            try:
                data = request.get_json()
                ip = data.get('ip')
                port = data.get('port', 8080)
                
                success = self.gps_manager.connect_to_phone(ip, port)
                return jsonify({
                    'success': success,
                    'message': 'Connecté au GPS' if success else 'Connexion GPS échouée'
                })
            except Exception as e:
                logger.error(f"Erreur connexion GPS: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/gps/data', methods=['GET'])
        def get_gps_data():
            try:
                data = self.gps_manager.get_current_data()
                return jsonify({
                    'success': data is not None,
                    'data': data
                })
            except Exception as e:
                logger.error(f"Erreur données GPS: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
        
        @self.app.route('/api/gps/open-app', methods=['POST'])
        def open_gps_app():
            try:
                data = request.get_json()
                app = data.get('app', 'osmand')
                coordinates = data.get('coordinates')
                
                success = self.gps_manager.open_gps_app(app, coordinates)
                return jsonify({
                    'success': success,
                    'message': 'Application GPS ouverte' if success else 'Erreur ouverture GPS'
                })
            except Exception as e:
                logger.error(f"Erreur ouverture app GPS: {e}")
                return jsonify({'success': False, 'error': str(e)}), 500
    
    def setup_error_handlers(self):
        """Setup error handlers"""
        
        @self.app.errorhandler(404)
        def not_found(error):
            return jsonify({
                'success': False,
                'error': 'Route non trouvée'
            }), 404
        
        @self.app.errorhandler(500)
        def internal_error(error):
            return jsonify({
                'success': False,
                'error': 'Erreur interne du serveur'
            }), 500
    
    def run(self, host='0.0.0.0', port=5000, debug=False):
        """Run the Flask application"""
        logger.info(f"Démarrage du serveur CarPlay sur {host}:{port}")
        self.app.run(host=host, port=port, debug=debug)

def main():
    """Main entry point"""
    try:
        # Ensure log directory exists
        os.makedirs('/var/log/carplay', exist_ok=True)
        
        # Create and run the application
        backend = CarPlayBackend()
        backend.run(debug=True if '--debug' in sys.argv else False)
        
    except KeyboardInterrupt:
        logger.info("Arrêt du serveur CarPlay")
    except Exception as e:
        logger.error(f"Erreur fatale: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()