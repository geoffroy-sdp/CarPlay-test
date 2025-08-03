#!/usr/bin/env python3
# System Manager - Handles system operations and logging
import logging
import subprocess
import os
import sys
import psutil
import json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class SystemManager:
    def __init__(self):
        self.log_files = {
            'system': '/var/log/carplay/app.log',
            'audio': '/var/log/carplay/audio.log',
            'gps': '/var/log/carplay/gps.log'
        }
        self.ensure_log_directories()
        
    def ensure_log_directories(self):
        """Ensure log directories exist"""
        try:
            os.makedirs('/var/log/carplay', exist_ok=True)
            
            # Create log files if they don't exist
            for log_type, log_file in self.log_files.items():
                if not os.path.exists(log_file):
                    with open(log_file, 'w') as f:
                        f.write('')
                        
        except Exception as e:
            logger.error(f"Erreur création répertoires logs: {e}")
    
    def get_system_status(self):
        """Get current system status"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Network interfaces
            network = psutil.net_if_addrs()
            
            # System uptime
            boot_time = psutil.boot_time()
            uptime = datetime.now() - datetime.fromtimestamp(boot_time)
            
            return {
                'cpu_usage': f"{cpu_percent:.1f}%",
                'memory_usage': f"{memory.percent:.1f}%",
                'disk_usage': f"{disk.percent:.1f}%",
                'uptime': str(uptime).split('.')[0],
                'network_interfaces': list(network.keys()),
                'python_version': sys.version.split()[0],
                'os': os.uname().sysname + ' ' + os.uname().release
            }
            
        except Exception as e:
            logger.error(f"Erreur récupération status système: {e}")
            return {}
    
    def get_logs(self):
        """Get system logs"""
        try:
            logs = {}
            
            for log_type, log_file in self.log_files.items():
                logs[log_type] = self.read_log_file(log_file)
            
            return logs
            
        except Exception as e:
            logger.error(f"Erreur récupération logs: {e}")
            return {'system': [], 'audio': [], 'gps': []}
    
    def read_log_file(self, log_file, max_lines=100):
        """Read log file and return formatted entries"""
        try:
            if not os.path.exists(log_file):
                return []
            
            with open(log_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Get last max_lines entries
            recent_lines = lines[-max_lines:] if len(lines) > max_lines else lines
            
            log_entries = []
            for line in recent_lines:
                line = line.strip()
                if line:
                    entry = self.parse_log_line(line)
                    if entry:
                        log_entries.append(entry)
            
            return log_entries
            
        except Exception as e:
            logger.error(f"Erreur lecture fichier log {log_file}: {e}")
            return []
    
    def parse_log_line(self, line):
        """Parse a log line and extract information"""
        try:
            # Expected format: YYYY-MM-DD HH:MM:SS - name - LEVEL - message
            parts = line.split(' - ', 3)
            
            if len(parts) >= 4:
                timestamp_str = parts[0]
                level = parts[2]
                message = parts[3]
                
                # Parse timestamp
                try:
                    timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S,%f')
                except:
                    # Alternative format
                    timestamp = datetime.strptime(timestamp_str.split(',')[0], '%Y-%m-%d %H:%M:%S')
                
                return {
                    'timestamp': timestamp.isoformat(),
                    'level': level,
                    'message': message
                }
            else:
                # Fallback for non-standard format
                return {
                    'timestamp': datetime.now().isoformat(),
                    'level': 'INFO',
                    'message': line
                }
                
        except Exception as e:
            logger.debug(f"Erreur parsing ligne log: {e}")
            return None
    
    def restart_backend(self):
        """Restart the backend application"""
        try:
            # Get current process PID
            current_pid = os.getpid()
            
            # Create restart script
            restart_script = f"""#!/bin/bash
sleep 2
kill {current_pid}
cd /home/project/backend
python3 app.py &
"""
            
            script_path = '/tmp/restart_backend.sh'
            with open(script_path, 'w') as f:
                f.write(restart_script)
            
            os.chmod(script_path, 0o755)
            
            # Execute restart script in background
            subprocess.Popen(['bash', script_path], 
                           stdout=subprocess.DEVNULL, 
                           stderr=subprocess.DEVNULL)
            
            logger.info("Redémarrage du backend programmé")
            return True
            
        except Exception as e:
            logger.error(f"Erreur redémarrage backend: {e}")
            return False
    
    def launch_chromium(self, url, width=1024, height=450, kiosk=True):
        """Launch Chromium with specified parameters"""
        try:
            cmd = ['chromium-browser']
            
            if kiosk:
                cmd.append('--kiosk')
            
            cmd.extend([
                f'--window-size={width},{height}',
                '--window-position=0,0',
                '--no-toolbar',
                '--disable-infobars',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-web-security',
                '--disable-features=TranslateUI',
                '--no-first-run',
                url
            ])
            
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info(f"Chromium lancé avec URL: {url}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lancement Chromium: {e}")
            return False
    
    def kill_chromium(self):
        """Kill all Chromium processes"""
        try:
            subprocess.run(['pkill', '-f', 'chromium'], capture_output=True)
            logger.info("Processus Chromium fermés")
            return True
        except Exception as e:
            logger.error(f"Erreur fermeture Chromium: {e}")
            return False
    
    def clear_logs(self, log_type='all'):
        """Clear log files"""
        try:
            if log_type == 'all':
                files_to_clear = list(self.log_files.values())
            elif log_type in self.log_files:
                files_to_clear = [self.log_files[log_type]]
            else:
                return False
            
            for log_file in files_to_clear:
                if os.path.exists(log_file):
                    with open(log_file, 'w') as f:
                        f.write('')
            
            logger.info(f"Logs effacés: {log_type}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur effacement logs: {e}")
            return False
    
    def export_logs(self):
        """Export all logs to a single file"""
        try:
            export_data = {
                'export_date': datetime.now().isoformat(),
                'system_info': self.get_system_status(),
                'logs': self.get_logs()
            }
            
            return json.dumps(export_data, indent=2, ensure_ascii=False)
            
        except Exception as e:
            logger.error(f"Erreur export logs: {e}")
            return None
    
    def get_process_list(self):
        """Get list of running processes"""
        try:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    processes.append(proc.info)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            
            return processes
            
        except Exception as e:
            logger.error(f"Erreur liste processus: {e}")
            return []
    
    def reboot_system(self):
        """Reboot the system"""
        try:
            logger.warning("Redémarrage système demandé")
            subprocess.run(['sudo', 'reboot'], capture_output=True)
            return True
        except Exception as e:
            logger.error(f"Erreur redémarrage système: {e}")
            return False
    
    def shutdown_system(self):
        """Shutdown the system"""
        try:
            logger.warning("Arrêt système demandé")
            subprocess.run(['sudo', 'shutdown', '-h', 'now'], capture_output=True)
            return True
        except Exception as e:
            logger.error(f"Erreur arrêt système: {e}")
            return False