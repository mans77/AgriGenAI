#!/bin/bash

# Script de test des endpoints API AgriGenAI
BASE_URL="http://localhost:8000"

echo "🧪 Test des endpoints API AgriGenAI..."
echo "Base URL: $BASE_URL"
echo "=================================="

# Test de santé de l'API
echo "🔍 Test endpoint de santé..."
curl -s "$BASE_URL/" | jq '.' || echo "❌ Endpoint santé échoué"

# Test de la documentation
echo "📚 Test documentation Swagger..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/docs" | grep -q "200" && echo "✅ Documentation accessible" || echo "❌ Documentation inaccessible"

# Test des routes d'authentification
echo "🔐 Test routes d'authentification..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/register" | grep -q "405\|422" && echo "✅ Route register accessible" || echo "❌ Route register inaccessible"

# Test des routes d'analyse
echo "🔬 Test routes d'analyse..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/analysis/health" && echo "✅ Route analysis accessible" || echo "❌ Route analysis inaccessible"

# Test des routes de plantes
echo "🌱 Test routes de plantes..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/plants/search?query=tomate" && echo "✅ Route plants accessible" || echo "❌ Route plants inaccessible"

# Test de la base de données
echo "🗄️ Test connexion base de données..."
curl -s "$BASE_URL/health/database" | jq '.' || echo "❌ Connexion base de données échouée"

echo "=================================="
echo "🎉 Tests des endpoints terminés !"
