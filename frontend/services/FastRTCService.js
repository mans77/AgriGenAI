/**
 * FastRTC Service - Service optimisé pour l'analyse photo rapide
 * Utilise WebSocket pour des communications temps réel
 * Implémente la compression d'images et le streaming
 */

import axios from 'axios';
import { getBackendURL } from '../config/api';
import { Platform } from 'react-native';

const API_BASE_URL = getBackendURL(Platform.OS);
const WS_URL = API_BASE_URL.replace('http://', 'ws://') + '/ws/stream';

class FastRTCService {
  constructor() {
    this.websocket = null;
    this.isConnected = false;
    this.messageQueue = [];
    this.sessionId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.eventListeners = {};
    this.heartbeatInterval = null;
  }

  /**
   * Se connecter au service WebSocket
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        console.log("🚀 Connexion FastRTC...");
        
        this.websocket = new WebSocket(WS_URL);
        
        this.websocket.onopen = () => {
          console.log("✅ FastRTC connecté");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Traiter la queue des messages en attente
          this.processMessageQueue();
          resolve();
        };
        
        this.websocket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        };
        
        this.websocket.onclose = () => {
          console.log("❌ FastRTC déconnecté");
          this.isConnected = false;
          this.attemptReconnect();
        };
        
        this.websocket.onerror = (error) => {
          console.error("❌ Erreur FastRTC:", error);
          reject(error);
        };
        
      } catch (error) {
        console.error("❌ Impossible de se connecter à FastRTC:", error);
        reject(error);
      }
    });
  }

  /**
   * Tentative de reconnexion automatique
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect().catch(() => {
          // La reconnexion a échoué, elle sera retentée automatiquement
        });
      }, 2000 * this.reconnectAttempts); // Délai exponentiel
    } else {
      console.error("❌ Impossible de se reconnecter à FastRTC");
    }
  }

  /**
   * Traiter les messages reçus du serveur
   */
  handleMessage(message) {
    console.log("📨 Message FastRTC reçu:", message.type);
    
    switch (message.type) {
      case 'connection_established':
        this.sessionId = message.session_id;
        console.log(`🎯 Session FastRTC: ${this.sessionId}`);
        break;
        
      case 'image_received':
        this.emit('imageReceived', message);
        break;
        
      case 'analysis_result':
        this.emit('analysisComplete', message.result);
        break;
        
      case 'error':
        this.emit('error', message.error);
        break;
        
      case 'pong':
        // Réponse au ping pour maintenir la connexion
        break;
        
      default:
        console.warn("⚠️ Type de message FastRTC inconnu:", message.type);
    }
  }

  /**
   * Envoyer un message au serveur
   */
  sendMessage(message) {
    if (this.isConnected && this.websocket) {
      this.websocket.send(JSON.stringify(message));
    } else {
      // Ajouter à la queue si pas connecté
      this.messageQueue.push(message);
      
      // Essayer de se connecter si pas déjà en cours
      if (!this.isConnected) {
        this.connect().catch(console.error);
      }
    }
  }

  /**
   * Traiter la queue des messages en attente
   */
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  /**
   * Analyser une image via FastRTC (WebSocket)
   */
  async analyzeImageFast(imageUri) {
    return new Promise((resolve, reject) => {
      // Timeout pour éviter l'attente infinie
      const timeout = setTimeout(() => {
        this.off('analysisComplete', onComplete);
        this.off('error', onError);
        reject(new Error('Timeout WebSocket'));
      }, 30000); // 30 secondes
      
      // Écouter la réponse
      const onComplete = (result) => {
        clearTimeout(timeout);
        this.off('analysisComplete', onComplete);
        this.off('error', onError);
        resolve(result);
      };
      
      const onError = (error) => {
        clearTimeout(timeout);
        this.off('analysisComplete', onComplete);
        this.off('error', onError);
        reject(new Error(error));
      };
      
      this.on('analysisComplete', onComplete);
      this.on('error', onError);
      
      // Convertir l'image en base64
      this.convertImageToBase64(imageUri)
        .then(base64Data => {
          console.log("📤 Envoi de l'image via WebSocket...");
          // Envoyer via WebSocket
          this.sendMessage({
            type: 'image_stream',
            data: base64Data,
            metadata: {
              timestamp: new Date().toISOString(),
              source: 'mobile_camera'
            }
          });
        })
        .catch(reject);
    });
  }

  /**
   * Analyser une image via HTTP traditionnel (fallback amélioré)
   */
  async analyzeImageHTTP(imageUri) {
    try {
      console.log("📤 Envoi de l'image via HTTP...");
      
      // Essayer d'abord avec FormData (upload fichier)
      try {
        const formData = new FormData();
        
        formData.append("file", {
          uri: imageUri,
          type: "image/jpeg",
          name: "photo.jpg",
        });

        const response = await axios.post(
          `${API_BASE_URL}/api/analyze-image/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "Accept": "application/json",
            },
            timeout: 30000,
          }
        );
        
        console.log("✅ Analyse HTTP réussie");
        return response.data;
        
      } catch (formError) {
        console.log("⚠️ Upload FormData échoué, essai base64...");
        
        // Fallback avec base64
        const base64Data = await this.convertImageToBase64(imageUri);
        
        const formData = new FormData();
        formData.append('image_data', base64Data);
        formData.append('metadata', JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'mobile_camera_http_fallback'
        }));
        
        const response = await axios.post(
          `${API_BASE_URL}/api/analyze-image-base64/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "Accept": "application/json",
            },
            timeout: 30000,
          }
        );
        
        console.log("✅ Analyse HTTP base64 réussie");
        return response.data;
      }
      
    } catch (error) {
      console.error("❌ Erreur analyse HTTP:", error);
      throw error;
    }
  }

  /**
   * Analyser une image (utilise FastRTC si disponible, sinon HTTP)
   */
  async analyzeImage(imageUri) {
    try {
      console.log("🚀 Analyse d'image FastRTC...");
      
      // Essayer FastRTC d'abord
      if (this.isConnected) {
        console.log("⚡ Utilisation WebSocket...");
        return await this.analyzeImageFast(imageUri);
      } else {
        // Essayer de se connecter rapidement
        try {
          await Promise.race([
            this.connect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
          ]);
          
          if (this.isConnected) {
            console.log("⚡ WebSocket reconnecté, analyse...");
            return await this.analyzeImageFast(imageUri);
          }
        } catch (connectError) {
          console.log("⚠️ Connexion WebSocket échouée:", connectError.message);
        }
      }
    } catch (error) {
      console.log("⚠️ FastRTC indisponible:", error.message);
    }
    
    // Fallback vers HTTP
    console.log("🔄 Fallback vers HTTP...");
    return await this.analyzeImageHTTP(imageUri);
  }

  /**
   * Convertir une image en base64 (React Native compatible)
   */
  async convertImageToBase64(imageUri) {
    try {
      // En React Native, on peut lire l'image directement via FileSystem
      if (typeof require !== 'undefined') {
        try {
          const { readAsStringAsync, EncodingType } = require('expo-file-system');
          const base64 = await readAsStringAsync(imageUri, {
            encoding: EncodingType.Base64,
          });
          return base64;
        } catch (fsError) {
          console.log("FileSystem non disponible, utilisation fetch...");
        }
      }
      
      // Fallback avec fetch pour les environnements web/autres
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Enlever le préfixe "data:image/jpeg;base64,"
          const base64Data = reader.result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
    } catch (error) {
      console.error("❌ Erreur conversion base64:", error);
      throw error;
    }
  }

  /**
   * Ping pour maintenir la connexion
   */
  ping() {
    if (this.isConnected) {
      this.sendMessage({
        type: 'ping',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Démarrer le heartbeat
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.ping();
    }, 30000); // Ping toutes les 30 secondes
  }

  /**
   * Event listener system
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * Se déconnecter proprement
   */
  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.websocket) {
      this.websocket.close();
    }
    
    this.isConnected = false;
    this.sessionId = null;
  }

  /**
   * Obtenir les statistiques de la session
   */
  async getStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/webrtc/stats`);
      return response.data;
    } catch (error) {
      console.error("Erreur récupération stats:", error);
      return null;
    }
  }
}

// Instance singleton
export const fastRTCService = new FastRTCService();

// Initialiser le service au démarrage
fastRTCService.connect().catch(() => {
  console.log("FastRTC non disponible au démarrage, utilisera HTTP");
});

// Démarrer le heartbeat
fastRTCService.startHeartbeat();

export default FastRTCService;