#!/usr/bin/env python3
# Audio Manager - Handles audio services and Bluetooth audio
import logging
import subprocess
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class AudioManager:
    def __init__(self):
        self.bluetooth_status = {
            'connected': False,
            'device': None,
            'track': None,
            'artist': None
        }
        self.pulseaudio_initialized = False
        
    def initialize_pulseaudio(self):
        """Initialize PulseAudio for Bluetooth A2DP"""
        try:
            # Load Bluetooth modules
            commands = [
                'pactl load-module module-bluetooth-policy',
                'pactl load-module module-bluetooth-discover',
                'pactl set-default-sink alsa_output.platform-soc_audio.analog-stereo'
            ]
            
            for cmd in commands:
                result = subprocess.run(cmd.split(), capture_output=True, text=True)
                if result.returncode != 0:
                    logger.warning(f"Commande PulseAudio échouée: {cmd}")
            
            self.pulseaudio_initialized = True
            logger.info("PulseAudio initialisé pour Bluetooth A2DP")
            return True
            
        except Exception as e:
            logger.error(f"Erreur initialisation PulseAudio: {e}")
            return False
    
    def get_status(self):
        """Get current audio status"""
        try:
            # Check Bluetooth connection status
            self.update_bluetooth_status()
            return self.bluetooth_status
        except Exception as e:
            logger.error(f"Erreur récupération status audio: {e}")
            return self.bluetooth_status
    
    def update_bluetooth_status(self):
        """Update Bluetooth connection status"""
        try:
            # Check if any Bluetooth device is connected
            result = subprocess.run(['bluetoothctl', 'info'], capture_output=True, text=True)
            
            if 'Connected: yes' in result.stdout:
                # Extract device name
                lines = result.stdout.split('\n')
                device_name = None
                for line in lines:
                    if 'Name:' in line:
                        device_name = line.split('Name:')[1].strip()
                        break
                
                self.bluetooth_status['connected'] = True
                self.bluetooth_status['device'] = device_name
                
                # Try to get current track info
                self.get_bluetooth_track_info()
            else:
                self.bluetooth_status = {
                    'connected': False,
                    'device': None,
                    'track': None,
                    'artist': None
                }
                
        except Exception as e:
            logger.error(f"Erreur mise à jour status Bluetooth: {e}")
    
    def get_bluetooth_track_info(self):
        """Get current track information from Bluetooth device"""
        try:
            # Try to get track info using playerctl
            result = subprocess.run(['playerctl', 'metadata'], capture_output=True, text=True)
            
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                track = None
                artist = None
                
                for line in lines:
                    if 'xesam:title' in line:
                        track = line.split('xesam:title')[1].strip()
                    elif 'xesam:artist' in line:
                        artist = line.split('xesam:artist')[1].strip()
                
                if track:
                    self.bluetooth_status['track'] = track
                    self.bluetooth_status['artist'] = artist
                    
        except Exception as e:
            logger.debug(f"Impossible de récupérer les infos de piste: {e}")
    
    def launch_spotify(self):
        """Launch Spotify in Chromium"""
        try:
            # Use system manager to launch Chromium with Spotify
            cmd = [
                'chromium-browser',
                '--kiosk',
                '--window-size=1024,450',
                '--window-position=0,0',
                '--no-toolbar',
                '--disable-infobars',
                '--disable-extensions',
                'https://open.spotify.com'
            ]
            
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info("Spotify lancé dans Chromium")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lancement Spotify: {e}")
            return False
    
    def launch_youtube_music(self):
        """Launch YouTube Music in Chromium"""
        try:
            cmd = [
                'chromium-browser',
                '--kiosk',
                '--window-size=1024,450',
                '--window-position=0,0',
                '--no-toolbar',
                '--disable-infobars',
                '--disable-extensions',
                'https://music.youtube.com'
            ]
            
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info("YouTube Music lancé dans Chromium")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lancement YouTube Music: {e}")
            return False
    
    def setup_bluetooth_audio_routing(self):
        """Setup audio routing from Bluetooth to jack output"""
        try:
            if not self.pulseaudio_initialized:
                self.initialize_pulseaudio()
            
            # Get Bluetooth source
            result = subprocess.run(['pactl', 'list', 'short', 'sources'], 
                                  capture_output=True, text=True)
            
            bluetooth_source = None
            for line in result.stdout.split('\n'):
                if 'bluez' in line and 'a2dp' in line:
                    bluetooth_source = line.split()[1]
                    break
            
            if bluetooth_source:
                # Route Bluetooth to default sink (jack output)
                cmd = f'pactl load-module module-loopback source={bluetooth_source}'
                subprocess.run(cmd.split(), capture_output=True)
                logger.info("Routage audio Bluetooth vers jack configuré")
                return True
            else:
                logger.warning("Source Bluetooth A2DP non trouvée")
                return False
                
        except Exception as e:
            logger.error(f"Erreur configuration routage audio: {e}")
            return False
    
    def cleanup(self):
        """Cleanup audio resources"""
        try:
            # Remove loopback modules
            result = subprocess.run(['pactl', 'list', 'short', 'modules'], 
                                  capture_output=True, text=True)
            
            for line in result.stdout.split('\n'):
                if 'module-loopback' in line:
                    module_id = line.split()[0]
                    subprocess.run(['pactl', 'unload-module', module_id], 
                                 capture_output=True)
                    
            logger.info("Ressources audio nettoyées")
        except Exception as e:
            logger.error(f"Erreur nettoyage audio: {e}")