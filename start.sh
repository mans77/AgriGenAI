#!/bin/bash

# Démarrage script pour Railway
echo "🚀 Démarrage AgriGenAI Backend sur Railway..."

# Vérifier les variables d'environnement essentielles
if [ -z "$PORT" ]; then
    export PORT=8000
    echo "⚠️  PORT non défini, utilisation du port par défaut: $PORT"
fi

# Aller dans le répertoire backend
cd backend

# Installer les dépendances Python
echo "📦 Installation des dépendances..."
python3 -m pip install -r requirements.txt

# Créer le dossier audio_files s'il n'existe pas
mkdir -p audio_files

# Afficher les informations de démarrage
echo "📡 Port: $PORT"
echo "🌐 Host: 0.0.0.0"
echo "🔧 Mode: Production"

# Démarrer l'application avec uvicorn
python3 -m uvicorn api.main:app --host 0.0.0.0 --port $PORT --workers 1