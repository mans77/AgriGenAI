import axios from 'axios';

class TavilyService {
  constructor() {
    this.apiKey = "tvly-your-key-here"; // À remplacer par votre vraie clé API
    this.baseUrl = "https://api.tavily.com";
    this.timeout = 10000; // 10 secondes
  }

  async searchPrices(query, options = {}) {
    try {
      const searchQuery = this.buildPriceQuery(query, options);
      
      const response = await axios.post(`${this.baseUrl}/search`, {
        api_key: this.apiKey,
        query: searchQuery,
        search_depth: options.depth || "basic",
        include_answer: true,
        include_domains: options.domains || [
          "agriculture.gouv.fr",
          "franceagrimer.fr",
          "terre-net.fr",
          "pleinchamp.com",
          "agrimarches.fr"
        ],
        max_results: options.maxResults || 5,
        include_images: false,
        include_raw_content: false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: this.timeout
      });

      return this.processPriceResults(response.data, query);
    } catch (error) {
      console.error('❌ Erreur recherche prix Tavily:', error);
      throw new Error(this.handleTavilyError(error));
    }
  }

  buildPriceQuery(query, options) {
    const location = options.location || "France";
    const timeframe = options.timeframe || "2024";
    
    // Optimiser la requête pour les prix agricoles
    let searchQuery = `prix ${query} agriculture ${location} ${timeframe}`;
    
    // Ajouter des termes spécifiques selon le type de recherche
    if (query.toLowerCase().includes('céréales')) {
      searchQuery += " blé maïs orge cours marché";
    } else if (query.toLowerCase().includes('légumes')) {
      searchQuery += " maraîchage grossiste MIN marché";
    } else if (query.toLowerCase().includes('fruits')) {
      searchQuery += " arboriculture grossiste export";
    } else if (query.toLowerCase().includes('bétail') || query.toLowerCase().includes('viande')) {
      searchQuery += " élevage cours abattoir";
    }
    
    return searchQuery;
  }

  processPriceResults(data, originalQuery) {
    const results = {
      query: originalQuery,
      summary: data.answer || "Aucune information de prix trouvée",
      sources: [],
      prices: [],
      timestamp: new Date().toISOString(),
      confidence: "medium"
    };

    if (data.results && data.results.length > 0) {
      // Traiter les sources
      results.sources = data.results.map(result => ({
        title: result.title,
        url: result.url,
        snippet: result.content?.substring(0, 200) + "..." || "",
        score: result.score || 0
      }));

      // Extraire les prix potentiels du contenu
      results.prices = this.extractPricesFromContent(data.results);
      
      // Évaluer la confiance selon la qualité des résultats
      if (results.prices.length > 0) {
        results.confidence = "high";
      } else if (data.answer && data.answer.length > 100) {
        results.confidence = "medium";
      } else {
        results.confidence = "low";
      }
    }

    return results;
  }

  extractPricesFromContent(results) {
    const prices = [];
    const priceRegexes = [
      /(\d+(?:,\d+)?)\s*€\/(?:tonne|t|kg|quintal)/gi,
      /(\d+(?:,\d+)?)\s*euros?\s*(?:la|le|par)?\s*(?:tonne|t|kg|quintal)/gi,
      /prix:\s*(\d+(?:,\d+)?)\s*€/gi,
      /(\d+(?:,\d+)?)\s*€\s*(?:\/\s*)?(?:tonne|t|kg|quintal)/gi
    ];

    results.forEach(result => {
      const content = (result.content || "") + " " + (result.title || "");
      
      priceRegexes.forEach(regex => {
        let match;
        while ((match = regex.exec(content)) !== null) {
          const price = parseFloat(match[1].replace(',', '.'));
          if (!isNaN(price) && price > 0) {
            prices.push({
              value: price,
              currency: "EUR",
              unit: this.detectUnit(match[0]),
              source: result.title || result.url,
              context: content.substring(Math.max(0, match.index - 50), match.index + 100)
            });
          }
        }
      });
    });

    // Supprimer les doublons et trier par pertinence
    return prices
      .filter((price, index, self) => 
        index === self.findIndex(p => Math.abs(p.value - price.value) < 0.01)
      )
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Garder les 5 prix les plus pertinents
  }

  detectUnit(priceText) {
    const text = priceText.toLowerCase();
    if (text.includes('tonne') || text.includes('/t')) return 'tonne';
    if (text.includes('kg')) return 'kg';
    if (text.includes('quintal')) return 'quintal';
    return 'unité';
  }

  async searchMarketTrends(product, options = {}) {
    try {
      const query = `évolution prix ${product} marché agriculture tendance ${options.period || '2024'}`;
      
      const response = await axios.post(`${this.baseUrl}/search`, {
        api_key: this.apiKey,
        query: query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 10,
        include_domains: [
          "franceagrimer.fr",
          "agriculture.gouv.fr",
          "terre-net.fr",
          "insee.fr"
        ]
      }, {
        timeout: this.timeout
      });

      return {
        product,
        trend: response.data.answer || "Tendances non disponibles",
        sources: response.data.results || [],
        analysis: this.analyzeTrend(response.data.answer),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erreur recherche tendances:', error);
      throw error;
    }
  }

  analyzeTrend(trendText) {
    if (!trendText) return { direction: 'stable', confidence: 'low' };
    
    const text = trendText.toLowerCase();
    let direction = 'stable';
    let confidence = 'medium';
    
    if (text.includes('hausse') || text.includes('augment') || text.includes('croiss')) {
      direction = 'up';
    } else if (text.includes('baisse') || text.includes('diminu') || text.includes('chut')) {
      direction = 'down';
    }
    
    if (text.includes('forte') || text.includes('important') || text.includes('significatif')) {
      confidence = 'high';
    }
    
    return { direction, confidence };
  }

  handleTavilyError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          return "Clé API Tavily invalide ou expirée";
        case 403:
          return "Accès interdit - vérifiez vos permissions Tavily";
        case 429:
          return "Limite de requêtes dépassée - veuillez patienter";
        case 500:
          return "Erreur serveur Tavily - réessayez plus tard";
        default:
          return data?.error || `Erreur Tavily: ${status}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      return "Timeout - la recherche a pris trop de temps";
    } else {
      return "Erreur de connexion à Tavily";
    }
  }

  async testConnection() {
    try {
      const response = await axios.post(`${this.baseUrl}/search`, {
        api_key: this.apiKey,
        query: "test agriculture prix",
        max_results: 1
      }, {
        timeout: 5000
      });
      
      return {
        success: true,
        message: "Connexion Tavily réussie",
        remainingQuota: response.headers['x-remaining-quota'] || 'Unknown'
      };
    } catch (error) {
      return {
        success: false,
        message: this.handleTavilyError(error),
        error: error.message
      };
    }
  }
}

export default new TavilyService();