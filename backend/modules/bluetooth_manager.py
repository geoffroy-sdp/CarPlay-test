#!/usr/bin/env python3
# Bluetooth Manager - Handles Bluetooth A2DP functionality
import logging
import subprocess
import time
import os

logger = logging.getLogger(__name__)

class BluetoothManager:
    def __init__(self):
        self.is_discoverable = False
        self.connected_devices = []
        self.a2dp_initialized = False
        
    def initialize_a2dp(self):
        """Initialize Bluetooth A2DP sink"""
        try:
            # Enable Bluetooth service
            subprocess.run(['sudo', 'systemctl', 'enable', 'bluetooth'], 
                         capture_output=True)
            subprocess.run(['sudo', 'systemctl', 'start', 'bluetooth'], 
                         capture_output=True)
            
            # Power on Bluetooth
            commands = [
                'power on',
                'agent on',
                'default-agent'
            ]
            
            for cmd in commands:
                process = subprocess.Popen(['bluetoothctl'], 
                                         stdin=subprocess.PIPE,
                                         stdout=subprocess.PIPE,
                                         stderr=subprocess.PIPE,
                                         text=True)
                process.communicate(input=cmd)
                time.sleep(1)
            
            self.a2dp_initialized = True
            logger.info("Bluetooth A2DP initialisé")
            return True
            
        except Exception as e:
            logger.error(f"Erreur initialisation Bluetooth A2DP: {e}")
            return False
    
    def enable_discovery(self):
        """Enable Bluetooth discovery mode"""
        try:
            if not self.a2dp_initialized:
                self.initialize_a2dp()
            
            commands = [
                'discoverable on',
                'pairable on'
            ]
            
            for cmd in commands:
                process = subprocess.Popen(['bluetoothctl'], 
                                         stdin=subprocess.PIPE,
                                         stdout=subprocess.PIPE,
                                         stderr=subprocess.PIPE,
                                         text=True)
                process.communicate(input=cmd)
                time.sleep(0.5)
            
            self.is_discoverable = True
            logger.info("Mode découverte Bluetooth activé")
            return True
            
        except Exception as e:
            logger.error(f"Erreur activation découverte Bluetooth: {e}")
            return False
    
    def disable_discovery(self):
        """Disable Bluetooth discovery mode"""
        try:
            commands = [
                'discoverable off',
                'pairable off'
            ]
            
            for cmd in commands:
                process = subprocess.Popen(['bluetoothctl'], 
                                         stdin=subprocess.PIPE,
                                         stdout=subprocess.PIPE,
                                         stderr=subprocess.PIPE,
                                         text=True)
                process.communicate(input=cmd)
                time.sleep(0.5)
            
            self.is_discoverable = False
            logger.info("Mode découverte Bluetooth désactivé")
            return True
            
        except Exception as e:
            logger.error(f"Erreur désactivation découverte Bluetooth: {e}")
            return False
    
    def get_connected_devices(self):
        """Get list of connected Bluetooth devices"""
        try:
            result = subprocess.run(['bluetoothctl', 'devices'], 
                                  capture_output=True, text=True)
            
            devices = []
            if result.returncode == 0:
                for line in result.stdout.split('\n'):
                    if line.strip() and 'Device' in line:
                        parts = line.split()
                        if len(parts) >= 3:
                            mac = parts[1]
                            name = ' '.join(parts[2:])
                            
                            # Check if device is connected
                            info_result = subprocess.run(['bluetoothctl', 'info', mac], 
                                                       capture_output=True, text=True)
                            
                            if 'Connected: yes' in info_result.stdout:
                                devices.append({
                                    'mac': mac,
                                    'name': name,
                                    'connected': True
                                })
            
            self.connected_devices = devices
            return devices
            
        except Exception as e:
            logger.error(f"Erreur récupération appareils Bluetooth: {e}")
            return []
    
    def disconnect(self):
        """Disconnect all Bluetooth devices"""
        try:
            devices = self.get_connected_devices()
            
            for device in devices:
                if device['connected']:
                    process = subprocess.Popen(['bluetoothctl'], 
                                             stdin=subprocess.PIPE,
                                             stdout=subprocess.PIPE,
                                             stderr=subprocess.PIPE,
                                             text=True)
                    process.communicate(input=f"disconnect {device['mac']}")
                    logger.info(f"Déconnecté de {device['name']}")
            
            self.connected_devices = []
            return True
            
        except Exception as e:
            logger.error(f"Erreur déconnexion Bluetooth: {e}")
            return False
    
    def pair_device(self, mac_address):
        """Pair with a specific Bluetooth device"""
        try:
            commands = [
                f'pair {mac_address}',
                f'trust {mac_address}',
                f'connect {mac_address}'
            ]
            
            for cmd in commands:
                process = subprocess.Popen(['bluetoothctl'], 
                                         stdin=subprocess.PIPE,
                                         stdout=subprocess.PIPE,
                                         stderr=subprocess.PIPE,
                                         text=True)
                
                stdout, stderr = process.communicate(input=cmd, timeout=10)
                time.sleep(2)
                
                if 'successful' in stdout.lower() or 'connection successful' in stdout.lower():
                    logger.info(f"Appariement réussi avec {mac_address}")
                else:
                    logger.warning(f"Problème appariement avec {mac_address}: {stdout}")
            
            return True
            
        except Exception as e:
            logger.error(f"Erreur appariement Bluetooth: {e}")
            return False
    
    def is_device_connected(self, mac_address):
        """Check if a specific device is connected"""
        try:
            result = subprocess.run(['bluetoothctl', 'info', mac_address], 
                                  capture_output=True, text=True)
            
            return 'Connected: yes' in result.stdout
            
        except Exception as e:
            logger.error(f"Erreur vérification connexion {mac_address}: {e}")
            return False
    
    def setup_a2dp_profile(self):
        """Setup A2DP profile for audio streaming"""
        try:
            # Create bluetoothd configuration for A2DP
            config_content = """
[General]
Class = 0x200414
DiscoverableTimeout = 0
PairableTimeout = 0
"""
            
            # Write configuration (requires root)
            try:
                with open('/etc/bluetooth/main.conf', 'a') as f:
                    f.write(config_content)
            except PermissionError:
                logger.warning("Impossible d'écrire la config Bluetooth (permissions)")
            
            # Restart Bluetooth service
            subprocess.run(['sudo', 'systemctl', 'restart', 'bluetooth'], 
                         capture_output=True)
            
            logger.info("Profil A2DP configuré")
            return True
            
        except Exception as e:
            logger.error(f"Erreur configuration A2DP: {e}")
            return False