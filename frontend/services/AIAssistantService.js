import axios from 'axios';
import { Platform } from 'react-native';
import TavilyService from './TavilyService';
import { getBackendURL } from '../config/api';

class AIAssistantService {
  constructor() {
    // URL dynamique basée sur la configuration centralisée
    this.apiBaseUrl = getBackendURL(Platform.OS);
    
    this.chatHistory = [];
    this.maxHistoryLength = 20;
    this.conversationContext = null;
    
    console.log('🔧 AIAssistantService - URL API:', this.apiBaseUrl);
  }

  async processMessage(message, options = {}) {
    try {
      // Analyser le type de message et la meilleure stratégie de réponse
      const messageAnalysis = this.analyzeMessage(message);
      
      // Ajouter le message utilisateur à l'historique
      this.addToHistory(message, 'user');
      
      let response;
      
      // Pour un chat rapide et détaillé, toujours traiter comme conseil général avec l'IA
      response = await this.handleGeneralAdvice(message, messageAnalysis, options.image);
      
      // Ajouter la réponse à l'historique
      this.addToHistory(response.text, 'assistant');
      
      return {
        text: response.text,
        type: messageAnalysis.type,
        confidence: response.confidence || 'high',
        sources: response.sources || [],
        suggestions: response.suggestions || [],
        model_used: response.model_used || 'ai',
        timestamp: new Date().toISOString(),
        context: messageAnalysis.context,
        processing_time: response.processing_time || 0
      };
      
    } catch (error) {
      console.error('❌ Erreur traitement message IA:', error);
      return {
        text: "Je rencontre une difficulté technique temporaire. Pouvez-vous réessayer votre demande ?",
        type: 'error',
        confidence: 'low',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  analyzeMessage(message) {
    const lowerMessage = message.toLowerCase();
    const analysis = {
      type: 'general_advice',
      context: [],
      keywords: [],
      urgency: 'normal',
      complexity: 'medium'
    };

    // Extraire les mots-clés importants
    const keywords = this.extractKeywords(lowerMessage);
    analysis.keywords = keywords;

    // Déterminer le type de question
    if (this.isPriceInquiry(lowerMessage)) {
      analysis.type = 'price_inquiry';
      analysis.context.push('market_data', 'price_trends');
    } else if (this.isDiagnostic(lowerMessage)) {
      analysis.type = 'diagnostic';
      analysis.context.push('plant_health', 'disease_detection');
      analysis.urgency = 'high';
    } else if (this.isTechnicalSupport(lowerMessage)) {
      analysis.type = 'technical_support';
      analysis.context.push('equipment', 'machinery', 'technology');
    } else if (this.isEcommerce(lowerMessage)) {
      analysis.type = 'ecommerce';
      analysis.context.push('products', 'suppliers', 'marketplace');
    }

    // Évaluer l'urgence
    if (lowerMessage.includes('urgent') || lowerMessage.includes('problème grave') || 
        lowerMessage.includes('maladie') || lowerMessage.includes('pest')) {
      analysis.urgency = 'high';
    }

    // Évaluer la complexité
    if (keywords.length > 5 || lowerMessage.length > 200) {
      analysis.complexity = 'high';
    } else if (keywords.length <= 2 || lowerMessage.length < 50) {
      analysis.complexity = 'low';
    }

    return analysis;
  }

  isPriceInquiry(message) {
    const priceKeywords = ['prix', 'coût', 'tarif', 'marché', 'cours', 'valeur', 'vendre', 'acheter', 'commerce'];
    return priceKeywords.some(keyword => message.includes(keyword));
  }

  isDiagnostic(message) {
    const diagnosticKeywords = ['maladie', 'problème', 'symptôme', 'diagnostic', 'traitement', 'soigner', 'guérir', 'parasite', 'champignon', 'virus', 'bactérie'];
    return diagnosticKeywords.some(keyword => message.includes(keyword));
  }

  isTechnicalSupport(message) {
    const techKeywords = ['tracteur', 'machine', 'équipement', 'panne', 'réparation', 'maintenance', 'technique', 'installation', 'configuration'];
    return techKeywords.some(keyword => message.includes(keyword));
  }

  isEcommerce(message) {
    const ecommerceKeywords = ['acheter', 'vendre', 'commande', 'fournisseur', 'produit', 'livraison', 'magasin', 'boutique', 'marketplace'];
    return ecommerceKeywords.some(keyword => message.includes(keyword));
  }

  extractKeywords(message) {
    const agriculturalTerms = [
      'blé', 'maïs', 'orge', 'avoine', 'soja', 'tournesol', 'colza',
      'tomate', 'pomme de terre', 'carotte', 'oignon', 'salade',
      'pomme', 'poire', 'cerise', 'raisin', 'pêche',
      'vache', 'porc', 'mouton', 'chèvre', 'poule', 'bœuf',
      'tracteur', 'moissonneuse', 'semoir', 'charrue', 'herse',
      'irrigation', 'fertilisant', 'pesticide', 'herbicide', 'fongicide',
      'sol', 'terre', 'champ', 'culture', 'plantation', 'récolte',
      'maladie', 'parasite', 'champignon', 'virus', 'traitement'
    ];
    
    return agriculturalTerms.filter(term => message.includes(term));
  }

  async handlePriceInquiry(message, analysis) {
    try {
      // Rechercher les prix avec Tavily
      const priceData = await TavilyService.searchPrices(message, {
        depth: 'advanced',
        maxResults: 3
      });

      // Enrichir avec l'IA pour interpréter les données
      const aiPrompt = `Question sur les prix: ${message}

Données de marché trouvées:
${priceData.summary}

Prix détectés: ${JSON.stringify(priceData.prices, null, 2)}

En tant qu'expert agricole, fournis une analyse complète incluant:
1. Interprétation des prix actuels
2. Comparaison avec les moyennes historiques si possible
3. Tendances et prévisions
4. Conseils économiques pour l'agriculteur
5. Facteurs influençant ces prix`;

      const aiResponse = await this.callAIAPI(aiPrompt, 'price_analysis');

      return {
        text: aiResponse.advice,
        confidence: 'high',
        sources: priceData.sources,
        market_data: priceData,
        suggestions: this.generatePriceSuggestions(analysis.keywords)
      };
      
    } catch (error) {
      console.error('❌ Erreur requête prix:', error);
      // Fallback sur l'IA seule
      return await this.handleGeneralAdvice(message, analysis);
    }
  }

  async handleDiagnostic(message, analysis, image = null) {
    try {
      let prompt = `Diagnostic agricole urgent: ${message}

En tant qu'expert phytosanitaire, fournis:
1. Analyse des symptômes décrits
2. Causes possibles (maladie, parasite, carence, stress)
3. Diagnostic le plus probable
4. Traitement recommandé étape par étape
5. Mesures préventives
6. Urgence d'intervention (1-10)
7. Coût estimé du traitement`;

      if (image) {
        prompt += `\n\nImage fournie: Analyse également l'image pour confirmer le diagnostic.`;
      }

      const response = await this.callAIAPI(prompt, 'diagnostic', image);

      return {
        text: response.advice,
        confidence: 'high',
        model_used: response.model_used,
        suggestions: this.generateDiagnosticSuggestions(analysis.keywords),
        urgency: analysis.urgency
      };
      
    } catch (error) {
      console.error('❌ Erreur diagnostic:', error);
      return await this.handleGeneralAdvice(message, analysis);
    }
  }

  async handleTechnicalSupport(message, analysis) {
    const prompt = `Support technique agricole: ${message}

En tant qu'expert en machinisme agricole, fournis:
1. Analyse du problème technique
2. Solutions étape par étape
3. Outils/pièces nécessaires
4. Niveau de difficulté (débutant/expert)
5. Coût estimé de la réparation
6. Conseils de sécurité
7. Maintenance préventive`;

    const response = await this.callAIAPI(prompt, 'technical_support');

    return {
      text: response.advice,
      confidence: 'medium',
      model_used: response.model_used,
      suggestions: this.generateTechnicalSuggestions(analysis.keywords)
    };
  }

  async handleEcommerce(message, analysis) {
    try {
      // Rechercher des produits/fournisseurs avec Tavily
      const searchResults = await TavilyService.searchMarketTrends(message, {
        period: '2024'
      });

      const prompt = `Question e-commerce agricole: ${message}

Informations marché:
${searchResults.trend}

En tant qu'expert en commerce agricole, fournis:
1. Recommandations d'achat/vente
2. Meilleurs fournisseurs/plateformes
3. Négociation et prix
4. Logistique et livraison
5. Aspects réglementaires
6. Opportunités de marché`;

      const response = await this.callAIAPI(prompt, 'ecommerce');

      return {
        text: response.advice,
        confidence: 'medium',
        model_used: response.model_used,
        sources: searchResults.sources,
        suggestions: this.generateEcommerceSuggestions(analysis.keywords)
      };
      
    } catch (error) {
      return await this.handleGeneralAdvice(message, analysis);
    }
  }

  async handleGeneralAdvice(message, analysis, image = null) {
    const context = this.buildConversationContext();
    const startTime = Date.now();
    
    // Prompt optimisé pour chat agricole
    const prompt = `${context}

Demande agricole: ${message}

Vous êtes un assistant agricole expert spécialisé dans les conseils pratiques et détaillés.
Répondez de manière conversationnelle, claire et directe comme dans un chat.
Donnez des conseils précis, pratiques et adaptés au contexte agricole africain/sénégalais.

Votre réponse doit être:
- Directe et conversationnelle (comme un chat)
- Détaillée mais structurée avec des émojis
- Pratique avec des actions concrètes
- Adaptée au climat tropical/sahélien

Ne mentionnez jamais le mot "question" dans votre réponse.`;

    const response = await this.callAIAPI(prompt, 'general_advice', image);
    const processingTime = Date.now() - startTime;

    return {
      text: response.advice,
      confidence: 'high',
      model_used: response.model_used,
      processing_time: processingTime,
      suggestions: this.generateGeneralSuggestions(analysis.keywords)
    };
  }

  async callAIAPI(prompt, type, image = null) {
    // URLs à tester dans l'ordre de priorité selon la plateforme
    let urlsToTry;
    
    if (Platform.OS === 'android') {
      // Pour Android (émulateur d'abord, puis physique)
      urlsToTry = [
        'http://10.0.2.2:8000',       // Émulateur Android
        'http://192.168.1.100:8000',  // Appareil physique Android
        this.apiBaseUrl,
        'http://localhost:8000'
      ];
    } else if (Platform.OS === 'ios') {
      // Pour iOS (simulateur d'abord, puis physique)
      urlsToTry = [
        'http://localhost:8000',      // Simulateur iOS
        'http://192.168.1.100:8000',  // Appareil physique iOS
        this.apiBaseUrl,
        'http://10.0.2.2:8000'
      ];
    } else {
      // Pour autres plateformes
      urlsToTry = [
        this.apiBaseUrl,
        'http://192.168.1.100:8000',
        'http://localhost:8000',
        'http://10.0.2.2:8000'
      ];
    }

    let lastError = null;

    for (const url of urlsToTry) {
      try {
        console.log(`🔄 Test connexion API: ${url}`);
        
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('advice_type', type);
        formData.append('conversation_history', JSON.stringify(this.getRecentHistory()));

        if (image) {
          formData.append('file', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.name || 'diagnostic.jpg'
          });
        }

        const response = await axios.post(`${url}/api/assistant/chat`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
          timeout: 30000, // 30 secondes par tentative
        });

        console.log(`✅ Connexion réussie avec: ${url}`);
        
        // Mettre à jour l'URL qui fonctionne pour les prochaines requêtes
        this.apiBaseUrl = url;
        
        // La nouvelle API retourne un format différent
        return {
          advice: response.data.response,
          model_used: response.data.model_used,
          timestamp: response.data.timestamp,
          has_image: response.data.has_image,
          conversation_id: response.data.conversation_id
        };
        
      } catch (error) {
        console.log(`❌ Échec connexion ${url}:`, error.message);
        lastError = error;
        continue;
      }
    }

    console.error('❌ Toutes les tentatives de connexion ont échoué');
    throw lastError || new Error('Impossible de se connecter à l\'API backend');
  }

  buildConversationContext() {
    const recentMessages = this.getRecentHistory(5);
    if (recentMessages.length === 0) return "";
    
    return `Contexte de conversation:
${recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
`;
  }

  addToHistory(message, role) {
    this.chatHistory.push({
      content: message,
      role: role,
      timestamp: new Date().toISOString()
    });
    
    // Limiter la taille de l'historique
    if (this.chatHistory.length > this.maxHistoryLength) {
      this.chatHistory = this.chatHistory.slice(-this.maxHistoryLength);
    }
  }

  getRecentHistory(count = 10) {
    return this.chatHistory.slice(-count);
  }

  generatePriceSuggestions(keywords) {
    return [
      "📈 Voir l'évolution des prix sur 6 mois",
      "💰 Comparer avec d'autres produits",
      "🎯 Optimiser le moment de vente",
      "📊 Analyser les tendances du marché"
    ];
  }

  generateDiagnosticSuggestions(keywords) {
    return [
      "📸 Prendre plus de photos des symptômes",
      "🔬 Tests de sol recommandés",
      "⚡ Actions d'urgence à prendre",
      "🛡️ Plan de prévention"
    ];
  }

  generateTechnicalSuggestions(keywords) {
    return [
      "🔧 Guide de maintenance",
      "📞 Contacter un technicien",
      "💡 Alternatives temporaires",
      "📋 Check-list de vérification"
    ];
  }

  generateEcommerceSuggestions(keywords) {
    return [
      "🏪 Trouver des fournisseurs locaux",
      "💳 Comparer les prix",
      "🚚 Options de livraison",
      "📄 Vérifier les certifications"
    ];
  }

  generateGeneralSuggestions(keywords) {
    return [
      "❓ Poser une question plus spécifique",
      "📖 Consulter nos guides",
      "🤝 Partager avec la communauté",
      "📞 Contacter un expert"
    ];
  }

  clearHistory() {
    this.chatHistory = [];
    this.conversationContext = null;
  }

  async testConnection() {
    try {
      console.log('🔍 Test de connexion à l\'API backend...');
      
      // Essayer d'abord l'endpoint de test de l'assistant
      const response = await axios.post(`${this.apiBaseUrl}/api/assistant/test-connection`, {}, {
        headers: {
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 secondes pour le test
      });

      console.log('✅ Test de connexion réussi');
      return {
        success: true,
        url: this.apiBaseUrl,
        response: response.data
      };
      
    } catch (error) {
      console.log('❌ Test de connexion échoué:', error.message);
      return {
        success: false,
        error: error.message,
        url: this.apiBaseUrl
      };
    }
  }

  getStats() {
    return {
      totalMessages: this.chatHistory.length,
      conversationStarted: this.chatHistory.length > 0 ? this.chatHistory[0].timestamp : null,
      lastActivity: this.chatHistory.length > 0 ? this.chatHistory[this.chatHistory.length - 1].timestamp : null,
      currentApiUrl: this.apiBaseUrl
    };
  }
}

export default new AIAssistantService();