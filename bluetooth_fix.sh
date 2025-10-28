#!/bin/bash
# ----------------------------------------------------
# Script : bluetooth-a2dp-fix.sh
# Objectif : Activer A2DP Sink sur PipeWire + BlueZ
#           + Rediriger le son vers la prise jack
#           + Reconnecter automatiquement un téléphone Bluetooth
# ----------------------------------------------------

PHONE_MAC="64:17:CD:2F:7B:55"  # Remplace par l'adresse MAC de ton téléphone

echo "🔹 1. Installation des paquets nécessaires..."
sudo apt install -y pipewire pipewire-pulse wireplumber libspa-0.2-bluetooth pulseaudio-module-bluetooth bluez-tools

echo "🔹 2. Activation A2DP Sink dans BlueZ..."
CONF_FILE="/etc/bluetooth/main.conf"
if ! grep -q "Enable=Source,Sink,Media,Socket" "$CONF_FILE"; then
    echo "Décommentation / ajout de Enable=Source,Sink,Media,Socket dans $CONF_FILE"
    sudo sed -i '/^\[General\]/a Enable=Source,Sink,Media,Socket' "$CONF_FILE"
fi

echo "🔹 3. Redémarrage des services Bluetooth et PipeWire..."
sudo systemctl restart bluetooth
systemctl --user restart pipewire pipewire-pulse wireplumber

sleep 2

echo "🔹 4. Connexion et trust du téléphone..."
bluetoothctl <<EOF
power on
agent on
default-agent
scan on
connect $PHONE_MAC
trust $PHONE_MAC
quit
EOF

sleep 2

echo "🔹 5. Vérification de la carte Bluetooth..."
BT_CARD=$(pactl list cards short | grep bluez_card | awk '{print $2}')
if [ -z "$BT_CARD" ]; then
    echo "❌ Carte Bluetooth non détectée. Relancez le script après avoir reconnecté le téléphone."
    exit 1
fi
echo "Carte Bluetooth détectée : $BT_CARD"

echo "🔹 6. Activation du profil A2DP Sink..."
pactl set-card-profile "$BT_CARD" a2dp-sink || echo "⚠️ Impossible d'activer A2DP. Vérifiez que le téléphone supporte A2DP."

echo "🔹 7. Forcer la sortie audio vers le jack..."
JACK_SINK=$(pactl list sinks short | grep mailbox | awk '{print $2}')
if [ -n "$JACK_SINK" ]; then
    pactl set-default-sink "$JACK_SINK"
    pactl move-sink-input all "$JACK_SINK"
    echo "✅ Son redirigé vers le jack : $JACK_SINK"
else
    echo "⚠️ Sortie jack introuvable"
fi

echo "✅ Script terminé. Jouez une musique sur le téléphone pour tester."
