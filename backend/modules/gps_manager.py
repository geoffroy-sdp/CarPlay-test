#!/usr/bin/env python3
# GPS Manager - Handles GPS functionality and phone connection
import logging
import socket
import json
import requests
import subprocess
import ipaddress
from datetime import datetime

logger = logging.getLogger(__name__)

class GPSManager:
    def __init__(self):
        self.phone_ip = None
        self.phone_port = 8080
        self.connected = False
        self.current_data = None
        self.last_update = None
        
    def detect_phone_ip(self):
        """Detect phone IP address on the network"""
        try:
            # Get current network info
            result = subprocess.run(['ip', 'route'], capture_output=True, text=True)
            
            network = None
            for line in result.stdout.split('\n'):
                if 'default' in line:
                    parts = line.split()
                    if len(parts) >= 3:
                        gateway = parts[2]
                        # Assume /24 network
                        network = f"{'.'.join(gateway.split('.')[:-1])}.0/24"
                        break
            
            if not network:
                logger.error("Impossible de déterminer le réseau")
                return None
            
            # Scan network for devices with port 8080 open
            network_obj = ipaddress.ip_network(network, strict=False)
            
            for ip in network_obj.hosts():
                ip_str = str(ip)
                
                # Skip common router IPs
                if ip_str.endswith('.1') or ip_str.endswith('.254'):
                    continue
                
                try:
                    # Try to connect to port 8080
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(1)
                    result = sock.connect_ex((ip_str, self.phone_port))
                    sock.close()
                    
                    if result == 0:
                        # Port is open, try to get GPS data to confirm
                        if self.test_gps_connection(ip_str):
                            self.phone_ip = ip_str
                            logger.info(f"Téléphone détecté: {ip_str}")
                            return ip_str
                            
                except Exception:
                    continue
            
            logger.warning("Aucun téléphone trouvé sur le réseau")
            return None
            
        except Exception as e:
            logger.error(f"Erreur détection téléphone: {e}")
            return None
    
    def test_gps_connection(self, ip):
        """Test GPS connection to a specific IP"""
        try:
            # Try to get GPS data from phone
            response = requests.get(f'http://{ip}:{self.phone_port}/gps', timeout=2)
            
            if response.status_code == 200:
                data = response.json()
                if 'latitude' in data and 'longitude' in data:
                    return True
            
            return False
            
        except Exception:
            return False
    
    def connect_to_phone(self, ip, port=8080):
        """Connect to phone GPS service"""
        try:
            self.phone_ip = ip
            self.phone_port = port
            
            # Test connection
            if self.test_gps_connection(ip):
                self.connected = True
                logger.info(f"Connecté au GPS du téléphone: {ip}:{port}")
                return True
            else:
                logger.error(f"Impossible de se connecter au GPS: {ip}:{port}")
                return False
                
        except Exception as e:
            logger.error(f"Erreur connexion GPS: {e}")
            return False
    
    def get_current_data(self):
        """Get current GPS data from phone"""
        try:
            if not self.connected or not self.phone_ip:
                return None
            
            response = requests.get(
                f'http://{self.phone_ip}:{self.phone_port}/gps',
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Process and validate GPS data
                gps_data = {
                    'latitude': data.get('latitude'),
                    'longitude': data.get('longitude'),
                    'speed': data.get('speed', 0),  # km/h
                    'heading': data.get('bearing', 0),  # degrees
                    'accuracy': data.get('accuracy', 0),  # meters
                    'altitude': data.get('altitude', 0),  # meters
                    'timestamp': datetime.now().isoformat()
                }
                
                # Validate coordinates
                if (gps_data['latitude'] is not None and 
                    gps_data['longitude'] is not None and
                    -90 <= gps_data['latitude'] <= 90 and
                    -180 <= gps_data['longitude'] <= 180):
                    
                    self.current_data = gps_data
                    self.last_update = datetime.now()
                    return gps_data
                else:
                    logger.warning("Coordonnées GPS invalides")
                    return None
            else:
                logger.error(f"Erreur HTTP GPS: {response.status_code}")
                return None
                
        except requests.exceptions.Timeout:
            logger.warning("Timeout connexion GPS")
            self.connected = False
            return None
        except Exception as e:
            logger.error(f"Erreur récupération données GPS: {e}")
            self.connected = False
            return None
    
    def open_gps_app(self, app_name='osmand', coordinates=None):
        """Open GPS navigation application"""
        try:
            if app_name.lower() == 'osmand':
                return self.open_osmand(coordinates)
            elif app_name.lower() == 'maps':
                return self.open_maps(coordinates)
            else:
                logger.error(f"Application GPS non supportée: {app_name}")
                return False
                
        except Exception as e:
            logger.error(f"Erreur ouverture app GPS: {e}")
            return False
    
    def open_osmand(self, coordinates):
        """Open OsmAnd GPS application"""
        try:
            if coordinates:
                lat = coordinates.get('lat')
                lon = coordinates.get('lon')
                url = f"osmand://map?lat={lat}&lon={lon}&z=15"
            else:
                url = "osmand://map"
            
            # Try to open OsmAnd
            subprocess.run(['am', 'start', '-a', 'android.intent.action.VIEW', '-d', url], 
                         capture_output=True)
            
            logger.info("OsmAnd ouvert")
            return True
            
        except Exception as e:
            logger.error(f"Erreur ouverture OsmAnd: {e}")
            return False
    
    def open_maps(self, coordinates):
        """Open Google Maps in browser"""
        try:
            if coordinates:
                lat = coordinates.get('lat')
                lon = coordinates.get('lon')
                url = f"https://www.google.com/maps/@{lat},{lon},15z"
            else:
                url = "https://www.google.com/maps"
            
            # Open in Chromium
            cmd = [
                'chromium-browser',
                '--kiosk',
                '--window-size=1024,600',
                '--window-position=0,0',
                url
            ]
            
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info("Google Maps ouvert")
            return True
            
        except Exception as e:
            logger.error(f"Erreur ouverture Maps: {e}")
            return False
    
    def get_location_info(self):
        """Get formatted location information"""
        if not self.current_data:
            return "Position inconnue"
        
        lat = self.current_data['latitude']
        lon = self.current_data['longitude']
        speed = self.current_data['speed']
        
        return {
            'coordinates': f"{lat:.6f}, {lon:.6f}",
            'speed': f"{speed:.1f} km/h" if speed else "0 km/h",
            'last_update': self.last_update.strftime('%H:%M:%S') if self.last_update else 'N/A'
        }
    
    def is_connected(self):
        """Check if GPS is connected"""
        return self.connected and self.phone_ip is not None
    
    def disconnect(self):
        """Disconnect from GPS"""
        self.connected = False
        self.phone_ip = None
        self.current_data = None
        logger.info("GPS déconnecté")