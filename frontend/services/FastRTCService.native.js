/**
 * FastRTC Service - Version React Native optimisée
 * Service simplifié pour React Native sans WebSocket complexe
 */

import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { getBackendURL, getCommonHeaders, getFormDataHeaders } from '../config/api';
import { Platform } from 'react-native';

const API_BASE_URL = getBackendURL(Platform.OS);

class FastRTCService {
  constructor() {
    this.isConnected = false;
    this.lastConnectionTest = null;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: 0
    };
  }

  /**
   * Test de connectivité rapide avec diagnostic détaillé
   */
  async testConnection() {
    try {
      const startTime = Date.now();
      console.log(`🌐 Test connectivité sur: ${API_BASE_URL}/health`);
      
      const response = await axios.get(`${API_BASE_URL}/health`, { 
        timeout: 5000,
        headers: getCommonHeaders()
      });
      const responseTime = Date.now() - startTime;
      
      this.isConnected = response.status === 200;
      this.lastConnectionTest = new Date();
      
      console.log(`✅ Test connectivité: OK (${responseTime}ms)`);
      console.log(`📊 Réponse serveur:`, response.data);
      
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      console.log(`❌ Test connectivité échoué: ${error.message}`);
      console.log(`🌐 URL testée: ${API_BASE_URL}/health`);
      
      // Diagnostic détaillé
      if (error.code === 'ECONNREFUSED') {
        console.log(`🔍 Diagnostic: Serveur non démarré ou port fermé`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`🔍 Diagnostic: Problème DNS/réseau - vérifiez l'IP`);
      } else if (error.message.includes('timeout')) {
        console.log(`🔍 Diagnostic: Timeout - serveur lent ou inaccessible`);
      } else {
        console.log(`🔍 Diagnostic: Erreur réseau inconnue - ${error.code || 'N/A'}`);
      }
      
      return false;
    }
  }

  /**
   * Valider une URI d'image et préparer les métadonnées
   */
  async validateAndPrepareImage(imageUri) {
    console.log("🔍 Validation URI:", imageUri);
    
    // Vérifier si l'URI est valide
    if (!imageUri || typeof imageUri !== 'string') {
      throw new Error('URI d\'image invalide');
    }
    
    // Vérifier si l'image existe
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Fichier image non trouvé');
      }
      
      console.log("📊 Info fichier:", {
        exists: fileInfo.exists,
        size: fileInfo.size,
        isDirectory: fileInfo.isDirectory,
        modificationTime: fileInfo.modificationTime
      });
      
      return {
        uri: imageUri,
        size: fileInfo.size,
        exists: true
      };
      
    } catch (error) {
      console.error("❌ Erreur validation image:", error);
      throw new Error(`Impossible de valider l'image: ${error.message}`);
    }
  }

  /**
   * Analyser une image de façon optimisée
   */
  async analyzeImage(imageUri) {
    console.log("🚀 Analyse d'image FastRTC...");
    console.log("📍 URI de l'image:", imageUri);
    
    // Validation de l'image d'abord
    try {
      await this.validateAndPrepareImage(imageUri);
    } catch (validationError) {
      console.error("❌ Validation échouée:", validationError.message);
      throw validationError;
    }
    
    // Test de connectivité d'abord
    if (!this.isConnected) {
      await this.testConnection();
    }

    const startTime = Date.now();
    this.stats.totalRequests++;
    
    try {
      console.log("📤 Envoi de l'image...");
      console.log("🌐 URL API:", `${API_BASE_URL}/api/analyze-image/`);

      // Utiliser fetch au lieu d'axios pour FormData - Plus fiable en React Native
      const formData = new FormData();
      
      // React Native FormData format - Correction pour les URI Expo
      const fileData = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      };
      
      console.log("📦 Données du fichier:", fileData);
      
      // Vérifier si c'est un URI local et le corriger si nécessaire
      if (imageUri.startsWith('file://')) {
        fileData.uri = imageUri;
      }
      
      formData.append('file', fileData);

      // Utiliser fetch pour FormData au lieu d'axios
      console.log("📤 Envoi avec fetch (plus stable pour FormData)...");
      const response = await fetch(`${API_BASE_URL}/api/analyze-image/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgriGenAI-Mobile/2.1.0',
          // Pas de Content-Type - laissé au navigateur
        },
      });

      console.log("⚙️ Configuration requête:", {
        url: `${API_BASE_URL}/api/analyze-image/`,
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgriGenAI-Mobile/2.1.0'
        }
      });

      const responseTime = Date.now() - startTime;
      
      console.log(`📡 Statut HTTP: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      this.stats.successfulRequests++;
      this.stats.lastRequestTime = responseTime;
      this.stats.averageResponseTime = 
        (this.stats.averageResponseTime * (this.stats.successfulRequests - 1) + responseTime) / 
        this.stats.successfulRequests;

      console.log(`✅ Analyse terminée en ${responseTime}ms`);
      console.log("📋 Réponse brute:", responseData);

      // Normaliser la réponse pour correspondre au format attendu
      const normalizedResult = this.normalizeAnalysisResult(responseData);
      console.log("📋 Réponse normalisée:", normalizedResult);

      return normalizedResult;

    } catch (error) {
      console.error("❌ Erreur analyse FastRTC:", error);
      console.error("📋 Détails erreur:", {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n')[0] // Première ligne seulement
      });
      
      // Si c'est une erreur réseau avec fetch, essayer le fallback
      if (error.message.includes('Network request failed') || 
          error.message.includes('fetch') ||
          error.name === 'TypeError') {
        console.log("🔄 Tentative fallback avec base64...");
        try {
          return await this.analyzeImageWithBase64Fallback(imageUri);
        } catch (fallbackError) {
          console.error("❌ Fallback base64 échoué:", fallbackError);
        }
      }
      
      // Formater l'erreur de façon conviviale
      const formattedError = this.formatError(error);
      throw new Error(formattedError);
    }
  }

  /**
   * Fallback: analyser l'image en la convertissant en base64
   */
  async analyzeImageWithBase64Fallback(imageUri) {
    console.log("🔄 Fallback base64 pour URI:", imageUri);
    
    try {
      // Lire l'image en base64 avec FileSystem
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log("✅ Image convertie en base64:", base64Data.length, "caractères");
      
      // Vérifier la taille - si > 2MB de base64, on refuse
      if (base64Data.length > 2000000) {
        throw new Error(`Image trop volumineuse (${(base64Data.length / 1000000).toFixed(1)}MB) pour l'envoi. Prenez une photo de plus petite taille.`);
      }
      
      // Envoyer via l'endpoint base64
      const formData = new FormData();
      formData.append('image_data', base64Data);
      formData.append('metadata', JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'mobile_camera_base64_fallback',
        originalUri: imageUri
      }));


      console.log("📤 Envoi via endpoint base64 avec fetch...");
      const response = await fetch(`${API_BASE_URL}/api/analyze-image-base64/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgriGenAI-Mobile/2.1.0',
          // Pas de Content-Type pour FormData
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log("✅ Fallback base64 réussi!");
      
      // Normaliser la réponse
      const normalizedResult = this.normalizeAnalysisResult(responseData);
      return normalizedResult;
      
    } catch (error) {
      console.error("❌ Erreur fallback base64:", error);
      throw error;
    }
  }

  /**
   * Normaliser le résultat d'analyse pour correspondre à l'interface attendue
   */
  normalizeAnalysisResult(apiResponse) {
    // Le format de l'API backend est déjà correct
    return {
      success: apiResponse.success || true,
      Diagnostique: apiResponse.Diagnostique || apiResponse.analysis?.Diagnostique || "Analyse effectuée",
      Symptômes: apiResponse.Symptômes || apiResponse.analysis?.Symptômes || "Observation des caractéristiques",
      Traitement: apiResponse.Traitement || apiResponse.analysis?.Traitement || "Recommandations générales",
      audio_file: apiResponse.audio_file || apiResponse.audio_name,
      audio_url: apiResponse.audio_url || apiResponse.audio,
      model_used: apiResponse.model_used || "claude-3.5-sonnet",
      processing_time: apiResponse.processing_time || 0,
      cached: apiResponse.cached || false
    };
  }

  /**
   * Formater les erreurs de façon conviviale
   */
  formatError(error) {
    if (error.name === 'TypeError' && error.message.includes('Network request failed')) {
      return 'Problème de réseau. Vérifiez que l\'API est accessible sur ' + API_BASE_URL;
    } else if (error.message.includes('timeout')) {
      return 'Délai d\'attente dépassé. Réessayez.';
    } else if (error.message.includes('HTTP 400')) {
      return 'Format d\'image non supporté.';
    } else if (error.message.includes('HTTP 500')) {
      return 'Erreur du serveur. Réessayez plus tard.';
    } else if (error.message.includes('fetch')) {
      return 'Erreur de communication avec le serveur.';
    } else {
      return `Erreur: ${error.message}`;
    }
  }

  /**
   * Diagnostiquer la connectivité
   */
  async diagnoseConnection() {
    const tests = [
      { name: 'Health Check', url: `${API_BASE_URL}/health` },
      { name: 'Root API', url: `${API_BASE_URL}/` },
      { name: 'API Status', url: `${API_BASE_URL}/api/status` }
    ];

    const results = [];
    let successful = 0;

    for (const test of tests) {
      const result = {
        name: test.name,
        url: test.url,
        timestamp: new Date().toISOString(),
        connected: false,
        responseTime: 0,
        error: null,
        status: 0
      };

      try {
        const startTime = Date.now();
        const response = await fetch(test.url, { 
          headers: getCommonHeaders()
        });
        result.responseTime = Date.now() - startTime;
        result.connected = response.ok;
        result.status = response.status;
        
        if (result.connected) successful++;
      } catch (error) {
        result.error = error.message;
        result.status = 0;
      }

      results.push(result);
    }

    return {
      timestamp: new Date().toISOString(),
      baseUrl: API_BASE_URL,
      tests: results,
      summary: {
        total_tests: tests.length,
        successful: successful,
        failed: tests.length - successful,
        success_rate: Math.round((successful / tests.length) * 100)
      }
    };
  }

  /**
   * Obtenir les statistiques de performance
   */
  getStats() {
    return {
      ...this.stats,
      isConnected: this.isConnected,
      lastConnectionTest: this.lastConnectionTest,
      successRate: this.stats.totalRequests > 0 ? 
        (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%' : 
        '0%'
    };
  }

  /**
   * Télécharger et jouer un fichier audio depuis l'API
   */
  async downloadAndPlayAudio(audioUrl) {
    try {
      console.log("🎵 Téléchargement audio depuis:", audioUrl);
      
      // Créer un nom de fichier unique
      const fileName = `audio_${Date.now()}.mp3`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Télécharger le fichier
      const downloadResult = await FileSystem.downloadAsync(audioUrl, fileUri);
      
      if (downloadResult.status === 200) {
        console.log("✅ Audio téléchargé avec succès:", downloadResult.uri);
        return downloadResult.uri;
      } else {
        throw new Error(`Échec du téléchargement: ${downloadResult.status}`);
      }
      
    } catch (error) {
      console.error("❌ Erreur téléchargement audio:", error);
      throw error;
    }
  }

  /**
   * Construire l'URL complète de l'audio à partir de l'URL relative
   */
  buildAudioURL(audioPath) {
    if (!audioPath) return null;
    
    // Si c'est déjà une URL complète, la retourner
    if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) {
      return audioPath;
    }
    
    // Sinon, construire l'URL complète
    const baseUrl = API_BASE_URL;
    const cleanPath = audioPath.startsWith('/') ? audioPath : `/${audioPath}`;
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Vérifier si un fichier audio existe sur le serveur
   * Fonction simplifiée - le téléchargement se chargera de la vérification
   */
  async checkAudioExists(audioUrl) {
    // Pour simplifier, on retourne toujours true 
    // La vérification se fera lors du téléchargement
    console.log("🔄 Vérification audio simplifiée:", audioUrl);
    return true;
  }
}

// Instance singleton
export const fastRTCService = new FastRTCService();

// Test de connectivité au démarrage
fastRTCService.testConnection().catch(() => {
  console.log("⚠️ API non disponible au démarrage");
});

export default FastRTCService;