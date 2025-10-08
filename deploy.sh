#!/bin/bash

# Script de déploiement pour AgriGenAI Backend
echo "🚀 Démarrage du déploiement AgriGenAI Backend..."

# Arrêter les conteneurs existants
echo "⏹️ Arrêt des conteneurs existants..."
docker-compose -f docker-compose.prod.yml down

# Supprimer les anciennes images
echo "🗑️ Nettoyage des anciennes images..."
docker system prune -f

# Récupérer la dernière image
echo "📥 Récupération de la dernière image..."
docker pull mansour-gueye/agrigen-backend:latest

# Démarrer les services
echo "🔄 Démarrage des services..."
docker-compose -f docker-compose.prod.yml up -d

# Vérifier le statut
echo "✅ Vérification du statut des conteneurs..."
docker-compose -f docker-compose.prod.yml ps

echo "🎉 Déploiement terminé !"
echo "📊 API disponible sur: http://$(hostname -I | awk '{print $1}'):8000"
echo "📚 Documentation: http://$(hostname -I | awk '{print $1}'):8000/docs"
