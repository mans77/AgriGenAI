import { useState, useRef, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

export const useLiveKit = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const roomRef = useRef(null);
  const participantRef = useRef(null);
  const recordingRef = useRef(null);

  // Configuration LiveKit
  const LIVEKIT_CONFIG = {
    wsUrl: "wss://your-livekit-domain.livekit.cloud",
    apiKey: "your-livekit-key",
    secretKey: "your-livekit-secret",
    roomName: "agrigen-voice-room",
    participantName: `user-${Date.now()}`,
  };

  const connectToRoom = useCallback(async () => {
    try {
      // TODO: Implémenter la connexion réelle à LiveKit
      // Pour l'instant, simulation de la connexion
      console.log('🔗 Connexion à LiveKit...');
      
      // Simulation d'une connexion réussie après 1 seconde
      setTimeout(() => {
        setIsConnected(true);
        console.log('✅ Connecté à LiveKit');
      }, 1000);

      return true;
    } catch (error) {
      console.error('❌ Erreur connexion LiveKit:', error);
      Alert.alert(
        'Erreur de connexion',
        'Impossible de se connecter au service vocal. Vérifiez votre connexion internet.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }, []);

  const disconnectFromRoom = useCallback(async () => {
    try {
      if (roomRef.current) {
        // TODO: Déconnecter de la room LiveKit
        roomRef.current = null;
      }
      setIsConnected(false);
      setIsRecording(false);
      setIsPlaying(false);
      console.log('🔌 Déconnecté de LiveKit');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
  }, []);

  // Fonction utilitaire pour nettoyer un enregistrement
  const cleanupRecording = useCallback(async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch (error) {
      console.log('⚠️ Erreur nettoyage enregistrement:', error);
      recordingRef.current = null; // Forcer le nettoyage
    }
  }, []);

  // Fonction pour arrêter un enregistrement existant
  const stopExistingRecording = useCallback(async () => {
    try {
      setIsRecording(false);
      await cleanupRecording();
      // Attendre un peu pour s'assurer que les ressources sont libérées
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log('⚠️ Erreur arrêt enregistrement existant:', error);
    }
  }, [cleanupRecording]);

  const startRecording = useCallback(async () => {
    try {
      // Vérifier si un enregistrement est déjà en cours
      if (isRecording || recordingRef.current) {
        console.log('⚠️ Enregistrement déjà en cours, arrêt de l\'existant...');
        await stopExistingRecording();
      }

      if (!isConnected) {
        const connected = await connectToRoom();
        if (!connected) return false;
      }

      // Demander les permissions audio
      console.log('🎤 Demande permission audio...');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès au microphone est nécessaire pour l\'enregistrement vocal.');
        return false;
      }

      // Configurer le mode audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Démarrer l'enregistrement
      console.log('🎤 Début enregistrement vocal...');
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      recordingRef.current = recording;
      setIsRecording(true);
      
      return true;
    } catch (error) {
      console.error('❌ Erreur enregistrement:', error);
      setIsRecording(false);
      // Nettoyer en cas d'erreur
      await cleanupRecording();
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement vocal.');
      return false;
    }
  }, [isConnected, connectToRoom, stopExistingRecording, cleanupRecording]);

  const stopRecording = useCallback(async () => {
    // Fonction de transcription locale
    const performTranscription = async (audioUri) => {
      try {
        console.log('📝 Transcription audio...', audioUri);
        
        // Utiliser la même logique de test de connectivité que SoilTypesScreen
        const FALLBACK_URLS = [
          'http://192.168.1.100:8000',
          'http://10.0.2.2:8000', // Android emulator host
          'http://localhost:8000', // Web/local
          'http://127.0.0.1:8000', // Localhost alternative
        ];

        // Test de connectivité pour trouver une URL qui marche
        let API_BASE_URL = null;
        for (const testUrl of FALLBACK_URLS) {
          try {
            console.log(`🔍 Test transcription: ${testUrl}/health`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const healthResponse = await fetch(`${testUrl}/health`, { 
              method: 'GET',
              signal: controller.signal,
              headers: { 'Accept': 'application/json' }
            });
            
            clearTimeout(timeoutId);
            
            if (healthResponse.ok) {
              console.log(`✅ URL transcription trouvée: ${testUrl}`);
              API_BASE_URL = testUrl;
              break;
            }
          } catch (error) {
            console.log(`❌ ${testUrl} - ${error.message}`);
          }
        }
        
        if (!API_BASE_URL) {
          throw new Error('Aucune URL d\'API accessible pour la transcription');
        }
        
        // Première tentative avec FormData
        try {
          const formData = new FormData();
          formData.append('audio', {
            uri: audioUri,
            type: 'audio/m4a',
            name: 'recording.m4a'
          });
          
          console.log('📤 Envoi transcription avec FormData...');
          const response = await fetch(`${API_BASE_URL}/api/transcribe-audio/`, {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'AgriGenAI-Mobile/2.1.0',
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Transcription FormData réussie:', result.text);
            
            return {
              text: result.text || "",
              confidence: result.confidence || 0.95,
              language: result.language || 'fr-FR'
            };
          }
        } catch (formDataError) {
          console.log('⚠️ FormData échoué, tentative base64...', formDataError.message);
        }
        
        // Fallback avec base64 si FormData échoue
        console.log('🔄 Conversion audio en base64...');
        const base64Data = await FileSystem.readAsStringAsync(audioUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log('✅ Audio converti en base64:', base64Data.length, 'caractères');
        
        // Vérifier la taille
        if (base64Data.length > 1000000) { // 1MB limit pour audio
          throw new Error(`Fichier audio trop volumineux (${(base64Data.length / 1000000).toFixed(1)}MB)`);
        }
        
        const base64FormData = new FormData();
        base64FormData.append('audio_data', base64Data);
        base64FormData.append('metadata', JSON.stringify({
          format: 'base64',
          type: 'audio/m4a',
          source: 'mobile_recording'
        }));
        
        console.log('📤 Envoi transcription avec base64...');
        const response = await fetch(`${API_BASE_URL}/api/transcribe-audio-base64/`, {
          method: 'POST',
          body: base64FormData,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AgriGenAI-Mobile/2.1.0',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Transcription base64 réussie:', result.text);
        
        return {
          text: result.text || "",
          confidence: result.confidence || 0.95,
          language: result.language || 'fr-FR'
        };
      } catch (error) {
        console.error('❌ Erreur transcription:', error);
        // Fallback pour développement
        return {
          text: "Bonjour, comment puis-je vous aider avec votre agriculture ?",
          confidence: 0.5,
          language: 'fr-FR'
        };
      }
    };

    try {
      setIsRecording(false);
      console.log('🛑 Arrêt enregistrement vocal');
      
      if (!recordingRef.current) {
        throw new Error('Aucun enregistrement en cours');
      }
      
      // Arrêter l'enregistrement et récupérer l'URI
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      console.log('📁 Fichier audio enregistré:', uri);
      
      // Nettoyer la référence
      recordingRef.current = null;
      
      if (!uri) {
        throw new Error('Impossible de sauvegarder l\'enregistrement');
      }
      
      // Transcrire l'audio
      console.log('📝 Transcription en cours...');
      const transcriptionResult = await performTranscription(uri);
      
      return {
        success: true,
        transcript: transcriptionResult?.text || "Erreur de transcription",
        audioData: uri,
        confidence: transcriptionResult?.confidence || 0
      };
    } catch (error) {
      console.error('❌ Erreur arrêt enregistrement:', error);
      // Nettoyer en cas d'erreur
      await cleanupRecording();
      return { success: false, error: error.message };
    }
  }, [cleanupRecording]);

  const playAudio = useCallback(async (audioData) => {
    try {
      if (!audioData || !audioData.uri) {
        console.log('⚠️ Pas de données audio à lire');
        return false;
      }

      setIsPlaying(true);
      console.log('🔊 Lecture audio...', audioData.uri);
      
      // Configurer le mode audio pour la lecture
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
      
      // Créer et charger le son
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioData.uri },
        { shouldPlay: true }
      );
      
      // Écouter la fin de la lecture
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          console.log('✅ Lecture audio terminée');
          sound.unloadAsync(); // Nettoyer la mémoire
        }
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erreur lecture audio:', error);
      setIsPlaying(false);
      return false;
    }
  }, []);

  const synthesizeSpeech = useCallback(async (text) => {
    try {
      console.log('🗣️ Synthèse vocale:', text.substring(0, 50) + '...');
      
      // Utiliser la même logique de test de connectivité
      const FALLBACK_URLS = [
        'http://192.168.1.100:8000',
        'http://10.0.2.2:8000', // Android emulator host
        'http://localhost:8000', // Web/local
        'http://127.0.0.1:8000', // Localhost alternative
      ];

      let API_BASE_URL = null;
      for (const testUrl of FALLBACK_URLS) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const healthResponse = await fetch(`${testUrl}/health`, { 
            method: 'GET',
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          });
          
          clearTimeout(timeoutId);
          
          if (healthResponse.ok) {
            console.log(`✅ URL TTS trouvée: ${testUrl}`);
            API_BASE_URL = testUrl;
            break;
          }
        } catch (error) {
          console.log(`❌ TTS ${testUrl} - ${error.message}`);
        }
      }
      
      if (!API_BASE_URL) {
        throw new Error('Aucune URL d\'API accessible pour TTS');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/text-to-speech/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AgriGenAI-Mobile/2.1.0',
        },
        body: JSON.stringify({ text: text })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ TTS réussi:', result.audio_filename);
      
      if (result.success && result.audio_url) {
        // Construire l'URL complète du fichier audio
        const audioUrl = result.audio_url.startsWith('http') 
          ? result.audio_url 
          : `${API_BASE_URL}${result.audio_url}`;
          
        return {
          uri: audioUrl,
          duration: text.length * 50, // Estimation
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erreur synthèse vocale:', error);
      return null;
    }
  }, []);


  return {
    // État
    isConnected,
    isRecording,
    isPlaying,
    
    // Fonctions de connexion
    connectToRoom,
    disconnectFromRoom,
    
    // Fonctions d'enregistrement
    startRecording,
    stopRecording,
    
    // Fonctions audio
    playAudio,
    synthesizeSpeech,
    
    // Configuration
    config: LIVEKIT_CONFIG,
  };
};