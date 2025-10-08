#!/bin/bash

# Configuration pour serveur de production Systalink
# Variables d'environnement pour le déploiement

# Informations serveur
export SERVER_HOST="systalink-server-ip"
export SERVER_USER="your-username"
export SERVER_PATH="/home/${SERVER_USER}/agrigen-backend"

# Configuration Docker
export DOCKER_IMAGE="mansour-gueye/agrigen-backend:latest"
export CONTAINER_NAME="agrigen-backend"
export POSTGRES_CONTAINER_NAME="agrigen-postgres"

# Ports
export API_PORT=8000
export DB_PORT=5432

# Base de données
export POSTGRES_DB=voice
export POSTGRES_USER=voice_user
export POSTGRES_PASSWORD=M7@ns5our

# Commandes utiles pour le déploiement
echo "🚀 Configuration de déploiement AgriGenAI"
echo "========================================="
echo "Image Docker: $DOCKER_IMAGE"
echo "Port API: $API_PORT"
echo "Port DB: $DB_PORT"
echo "Serveur: $SERVER_HOST"
echo "Utilisateur: $SERVER_USER"
echo "Chemin: $SERVER_PATH"
echo "========================================="

# Fonctions utiles
deploy_to_server() {
    echo "🚀 Déploiement vers le serveur..."
    ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && ./deploy.sh"
}

check_server_status() {
    echo "🔍 Vérification du statut du serveur..."
    ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && docker-compose -f docker-compose.prod.yml ps"
}

test_endpoints_remote() {
    echo "🧪 Test des endpoints sur le serveur..."
    curl -s "http://$SERVER_HOST:$API_PORT/" | jq '.'
    curl -s "http://$SERVER_HOST:$API_PORT/health" | jq '.'
    curl -s "http://$SERVER_HOST:$API_PORT/health/database" | jq '.'
}

# Affichage des fonctions disponibles
echo "Fonctions disponibles:"
echo "- deploy_to_server: Déployer sur le serveur"
echo "- check_server_status: Vérifier le statut"
echo "- test_endpoints_remote: Tester les endpoints"
