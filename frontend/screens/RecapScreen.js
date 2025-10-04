import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Alert,
  Dimensions,
  Share
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { fastRTCService } from '../services/FastRTCService.native';

const { width } = Dimensions.get('window');

const RecapScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { data, image } = route.params;
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Accueil');

  // Fonction utilitaire pour extraire les données de diagnostic
  const extractDiagnosticData = (data) => {
    const diagnostic = {
      diagnostic: "",
      symptomes: "",
      traitement: ""
    };

    // Chercher le diagnostic - priorité aux données réelles
    if (data?.Diagnostique && data.Diagnostique !== "Analyse effectuée" && data.Diagnostique.trim() !== "") {
      diagnostic.diagnostic = data.Diagnostique;
    } else if (data?.Diagnostic && data.Diagnostic !== "Analyse effectuée" && data.Diagnostic.trim() !== "") {
      diagnostic.diagnostic = data.Diagnostic;
    } else if (data?.diagnostic && data.diagnostic !== "Analyse effectuée" && data.diagnostic.trim() !== "") {
      diagnostic.diagnostic = data.diagnostic;
    } else if (data?.result?.Diagnostique && data.result.Diagnostique.trim() !== "") {
      diagnostic.diagnostic = data.result.Diagnostique;
    } else if (data?.result?.Diagnostic && data.result.Diagnostic.trim() !== "") {
      diagnostic.diagnostic = data.result.Diagnostic;
    } else if (data?.visual_analysis && data.visual_analysis.trim() !== "") {
      diagnostic.diagnostic = data.visual_analysis;
    } else if (data?.response && data.response.trim() !== "") {
      diagnostic.diagnostic = data.response;
    } else if (data?.text && data.text.trim() !== "") {
      diagnostic.diagnostic = data.text;
    }

    // Chercher les symptômes
    if (data?.Symptômes && data.Symptômes.trim() !== "") {
      diagnostic.symptomes = data.Symptômes;
    } else if (data?.symptomes && data.symptomes.trim() !== "") {
      diagnostic.symptomes = data.symptomes;
    } else if (data?.symptoms && data.symptoms.trim() !== "") {
      diagnostic.symptomes = data.symptoms;
    } else if (data?.result?.Symptômes && data.result.Symptômes.trim() !== "") {
      diagnostic.symptomes = data.result.Symptômes;
    }

    // Chercher le traitement
    if (data?.Traitement && data.Traitement.trim() !== "") {
      diagnostic.traitement = data.Traitement;
    } else if (data?.traitement && data.traitement.trim() !== "") {
      diagnostic.traitement = data.traitement;
    } else if (data?.treatment && data.treatment.trim() !== "") {
      diagnostic.traitement = data.treatment;
    } else if (data?.result?.Traitement && data.result.Traitement.trim() !== "") {
      diagnostic.traitement = data.result.Traitement;
    }

    return diagnostic;
  };

  const diagnosticData = extractDiagnosticData(data);

  // Debug des données reçues
  useEffect(() => {
    console.log("📋 Données RecapScreen complètes:", JSON.stringify(data, null, 2));
    console.log("🔍 Clés disponibles dans data:", Object.keys(data || {}));
    console.log("🖼️ Image:", image);
    console.log("🎵 Audio URL:", data?.audio_url);
    
    // Debug spécifique pour le diagnostic - toutes les possibilités
    console.log("🩺 Diagnostique value:", data?.Diagnostique);
    console.log("🩺 Diagnostic value:", data?.Diagnostic);
    console.log("🩺 diagnostic value:", data?.diagnostic);
    console.log("🩺 response value:", data?.response);
    console.log("🩺 text value:", data?.text);
    console.log("🩺 result value:", data?.result);
    console.log("🩺 visual_analysis value:", data?.visual_analysis);
    
    // Si result est un objet, explorer son contenu
    if (data?.result && typeof data.result === 'object') {
      console.log("🔍 Contenu de result:", Object.keys(data.result));
      console.log("🩺 result.Diagnostique:", data.result.Diagnostique);
      console.log("🩺 result.Diagnostic:", data.result.Diagnostic);
      console.log("🩺 result.Symptômes:", data.result.Symptômes);  
      console.log("🩺 result.Traitement:", data.result.Traitement);
    }

    // Debug des données extraites
    console.log("✅ Données extraites par extractDiagnosticData:");
    console.log("  - diagnostic:", diagnosticData.diagnostic);
    console.log("  - symptomes:", diagnosticData.symptomes);
    console.log("  - traitement:", diagnosticData.traitement);
  }, []);

  // Configuration audio au démarrage du composant - OPTIMISÉE
  useEffect(() => {
    const configureAudio = async () => {
      try {
        console.log("🎵 Configuration audio...");
        
        // Demander les permissions audio si nécessaire
        try {
          const { status } = await Audio.requestPermissionsAsync();
          console.log("📋 Permissions audio:", status);
          
          if (status !== 'granted') {
            console.warn("⚠️ Permissions audio non accordées");
            Alert.alert(
              "Permissions requises", 
              "L'application a besoin des permissions audio pour fonctionner correctement."
            );
          }
        } catch (permError) {
          console.warn("⚠️ Impossible de demander les permissions:", permError);
        }
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          // interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          // interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        });
        
        console.log("✅ Configuration audio réussie");
      } catch (error) {
        console.error("❌ Erreur configuration audio:", error);
      }
    };

    configureAudio();
  }, []);

  const playAudio = async () => {
    try {
      setIsLoading(true);
      console.log("🎵 Début lecture audio");
      
      // Arrêter le son précédent s'il existe
      if (sound) {
        console.log("🛑 Arrêt du son précédent");
        await sound.unloadAsync();
        setSound(null);
      }

      // Vérifier la disponibilité de l'audio dans les données
      const audioPath = data?.audio_url || data?.audio;
      if (!audioPath) {
        Alert.alert("Erreur", "Aucun fichier audio disponible dans les données de l'analyse");
        setIsLoading(false);
        return;
      }

      console.log("🎵 Chemin audio détecté:", audioPath);

      // Utiliser le service FastRTC pour construire l'URL
      const fullAudioUrl = fastRTCService.buildAudioURL(audioPath);
      console.log("🔗 URL audio complète:", fullAudioUrl);

      if (!fullAudioUrl) {
        Alert.alert("Erreur", "Impossible de construire l'URL audio");
        setIsLoading(false);
        return;
      }

      console.log("🎵 Préparation de la lecture audio...");

      // Vérification simplifiée de l'audio (ne bloque plus le processus)
      const audioExists = await fastRTCService.checkAudioExists(fullAudioUrl);
      console.log(`🔍 Statut audio: ${audioExists ? 'Disponible' : 'À vérifier'}`);

      // Télécharger le fichier audio localement pour une lecture optimale
      let localAudioUri;
      try {
        localAudioUri = await fastRTCService.downloadAndPlayAudio(fullAudioUrl);
      } catch (downloadError) {
        console.log("⚠️ Téléchargement échoué, tentative de lecture directe...", downloadError.message);
        localAudioUri = fullAudioUrl; // Fallback vers lecture directe
      }

      console.log("🎵 URI audio pour lecture:", localAudioUri);

      // Créer et charger le son
      console.log("🔄 Création du sound object...");
      
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: localAudioUri },
        { 
          shouldPlay: false,
          progressUpdateIntervalMillis: 500,
          positionMillis: 0,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        (playbackStatus) => {
          updatePlaybackStatus(playbackStatus);
        }
      );
      
      console.log("📊 Statut audio:", status);
      
      if (status.isLoaded) {
        console.log("✅ Audio chargé avec succès!");
        setSound(newSound);
        
        // Démarrer la lecture immédiatement
        try {
          console.log("▶️ Démarrage de la lecture...");
          await newSound.playAsync();
          setIsPlaying(true);
          console.log("🎵 Lecture audio démarrée avec succès");
        } catch (playError) {
          console.error("❌ Erreur lors du démarrage de la lecture:", playError);
          Alert.alert("Erreur", `Impossible de jouer l'audio: ${playError.message}`);
        }
        
      } else {
        console.error("❌ Échec du chargement audio:", status.error);
        throw new Error(`Impossible de charger l'audio: ${status.error || 'Erreur de chargement'}`);
      }

    } catch (error) {
      console.error("❌ Erreur lecture audio complète:", error);
      console.error("❌ Stack trace:", error.stack);
      Alert.alert(
        "Erreur audio", 
        `Impossible de lire le fichier audio:\n${error.message}\n\nVérifiez votre connexion réseau.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlaybackStatus = (status) => {
    console.log("🎵 Statut audio:", status);
    
    if (status.didJustFinish) {
      console.log("🎵 Lecture terminée");
      setIsPlaying(false);
    }
    
    if (status.error) {
      console.error("❌ Erreur playback:", status.error);
      setIsPlaying(false);
      Alert.alert("Erreur", `Erreur de lecture: ${status.error}`);
    }
  };

  const stopAudio = async () => {
    try {
      if (sound) {
        console.log("⏹️ Arrêt de l'audio");
        await sound.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("❌ Erreur arrêt audio:", error);
    }
  };

  const pauseAudio = async () => {
    try {
      if (sound && isPlaying) {
        console.log("⏸️ Pause de l'audio");
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("❌ Erreur pause audio:", error);
    }
  };

  const resumeAudio = async () => {
    try {
      if (sound && !isPlaying) {
        console.log("▶️ Reprise de l'audio");
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("❌ Erreur reprise audio:", error);
    }
  };

  // Fonction de partage
  const shareResult = async () => {
    try {
      let message = '🌱 Diagnostic AgriGenAI 🌱\n\n';

      if (diagnosticData.diagnostic) {
        message += `🔍 Diagnostic: ${diagnosticData.diagnostic}\n\n`;
      }
      
      if (diagnosticData.symptomes) {
        message += `⚠️ Symptômes: ${diagnosticData.symptomes}\n\n`;
      }
      
      if (diagnosticData.traitement) {
        message += `💊 Traitement: ${diagnosticData.traitement}\n\n`;
      }

      if (!diagnosticData.diagnostic && !diagnosticData.symptomes && !diagnosticData.traitement) {
        message += 'Analyse en cours de traitement...\n\n';
      }

      message += '📱 Analysé avec AgriGenAI - Votre assistant agricole intelligent';

      const shareContent = {
        title: 'Diagnostic AgriGenAI',
        message: message.trim(),
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  // Navigation améliorée vers les autres écrans - CORRIGÉE
  const navigateToTab = (tabName, screenName) => {
    setActiveTab(tabName);
    
    try {
      // Gestion intelligente de la navigation selon la structure
      if (screenName === 'Home') {
        // Retour vers l'accueil principal
        navigation.navigate('Main', { screen: 'Home' });
      } else if (screenName === 'Treatments') {
        // Navigation vers l'écran traitements
        navigation.navigate('Main', { screen: 'Treatments' });
      } else if (screenName === 'Monitoring') {
        // Navigation vers monitoring
        navigation.navigate('Monitoring');
      } else if (screenName === 'Community') {
        // Navigation vers communauté
        navigation.navigate('Community');
      } else if (screenName === 'Profile') {
        // Navigation vers profil
        navigation.navigate('Main', { screen: 'Profile' });
      } else {
        // Fallback pour autres écrans
        navigation.navigate(screenName);
      }
    } catch (error) {
      console.error("Erreur navigation:", error);
      // Fallback de sécurité - retour à l'accueil
      navigation.navigate('Main', { screen: 'Home' });
    }
  };

  // Nettoyer le son au démontage du composant
  useEffect(() => {
    return () => {
      if (sound) {
        console.log("🧹 Nettoyage audio");
        sound.unloadAsync().catch(console.error);
      }
    };
  }, [sound]);

  // Gestion de l'état de l'app (pause/reprise)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' && isPlaying) {
        pauseAudio();
      }
    };

    // Note: AppState listener peut être ajouté ici si nécessaire
    return () => {
      // Cleanup
    };
  }, [isPlaying]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header avec navigation améliorée */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#218E54" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Résultats de l'analyse</Text>
          <Text style={styles.headerSubtitle}>Diagnostic complet</Text>
        </View>

        <TouchableOpacity 
          onPress={shareResult}
          style={styles.headerButton}
        >
          <Ionicons name="share-outline" size={24} color="#218E54" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image analysée avec overlay moderne */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: image }} 
            style={styles.analysisImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <View style={styles.analysisTag}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.analysisTagText}>
                Analysé le {new Date().toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        </View>

        {/* Carte de diagnostic principale */}
        {diagnosticData.diagnostic && (
          <View style={styles.diagnosticCard}>
            <View style={styles.diagnosticHeader}>
              <View style={styles.diagnosticIcon}>
                <Ionicons name="medical" size={24} color="#218E54" />
              </View>
              <Text style={styles.diagnosticTitle}>Diagnostic</Text>
            </View>
            
            <View style={styles.diagnosticContent}>
              <Text style={styles.diagnosticText}>
                {diagnosticData.diagnostic}
              </Text>
            </View>
          </View>
        )}

        {/* Section Symptômes avec icône */}
        {diagnosticData.symptomes && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="warning" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.sectionTitle}>Symptômes</Text>
            </View>
            <Text style={styles.sectionText}>
              {diagnosticData.symptomes}
            </Text>
          </View>
        )}

        {/* Section Traitement avec icône */}
        {diagnosticData.traitement && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="fitness" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.sectionTitle}>Traitement</Text>
            </View>
            <Text style={styles.sectionText}>
              {diagnosticData.traitement}
            </Text>
          </View>
        )}

        {/* Affichage de debug si aucune donnée trouvée */}
        {!diagnosticData.diagnostic && !diagnosticData.symptomes && !diagnosticData.traitement && (
          <View style={styles.debugCard}>
            <View style={styles.debugHeader}>
              <Ionicons name="bug" size={24} color="#EF4444" />
              <Text style={styles.debugTitle}>Données de diagnostic</Text>
            </View>
            <Text style={styles.debugText}>
              {JSON.stringify(data, null, 2)}
            </Text>
          </View>
        )}

        {/* Bouton audio redesigné avec meilleure gestion */}
        <View style={styles.audioSection}>
          <TouchableOpacity 
            style={[styles.audioButton, isLoading && styles.buttonDisabled]} 
            onPress={() => {
              if (isLoading) return;
              
              if (isPlaying) {
                pauseAudio();
              } else if (sound) {
                resumeAudio();
              } else {
                playAudio();
              }
            }}
            disabled={isLoading}
          >
            <View style={styles.audioIconContainer}>
              <Ionicons 
                name={
                  isLoading ? 'hourglass' : 
                  isPlaying ? 'pause' : 
                  sound ? 'play' : 'volume-high'
                } 
                size={24} 
                color="white" 
              />
            </View>
            <View style={styles.audioTextContainer}>
              <Text style={styles.audioButtonTitle}>
                {isLoading ? 'Chargement...' : 
                 isPlaying ? 'Pause audio' : 
                 sound ? 'Reprendre' : 'Écouter le diagnostic'}
              </Text>
              <Text style={styles.audioButtonSubtitle}>
                {isPlaying ? 'Lecture en cours...' : 
                 sound ? 'Audio prêt' : 'Synthèse vocale disponible'}
              </Text>
            </View>
            {!isLoading && isPlaying && (
              <View style={styles.audioIndicator}>
                <View style={[styles.audioWave, styles.audioWaveAnimation]} />
                <View style={[styles.audioWave, styles.audioWaveAnimation, { animationDelay: '0.2s' }]} />
                <View style={[styles.audioWave, styles.audioWaveAnimation, { animationDelay: '0.4s' }]} />
              </View>
            )}
          </TouchableOpacity>
          
          {/* Bouton stop séparé si audio en cours */}
          {sound && (
            <TouchableOpacity 
              style={styles.stopButton} 
              onPress={stopAudio}
            >
              <Ionicons name="stop" size={20} color="#EF4444" />
              <Text style={styles.stopButtonText}>Arrêter</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Informations techniques */}
        {(data?.model_used || data?.processing_time || data?.cached) && (
          <View style={styles.technicalInfo}>
            <Text style={styles.technicalTitle}>Informations techniques</Text>
            <View style={styles.technicalGrid}>
              {data?.processing_time && (
                <View style={styles.technicalItem}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.technicalText}>
                    Temps: {typeof data.processing_time === 'number' ? 
                            data.processing_time.toFixed(2) : 
                            data.processing_time}s
                  </Text>
                </View>
              )}
              {data?.cached && (
                <View style={styles.technicalItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.technicalText}>Résultat mis en cache</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Espacement pour la navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Barre de navigation bottom - MODIFIÉE sans texte comme HomeScreen */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Accueil' && styles.navItemActive]}
          onPress={() => navigateToTab('Accueil', 'Home')}
        >
          <Ionicons 
            name="home" 
            size={28} 
            color={activeTab === 'Accueil' ? '#218E54' : '#9CA3AF'} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Traitements' && styles.navItemActive]}
          onPress={() => navigateToTab('Traitements', 'Treatments')}
        >
          <Ionicons 
            name="construct" 
            size={28} 
            color={activeTab === 'Traitements' ? '#218E54' : '#9CA3AF'} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Monitoring' && styles.navItemActive]}
          onPress={() => navigateToTab('Monitoring', 'Monitoring')}
        >
          <Ionicons 
            name="radio" 
            size={28} 
            color={activeTab === 'Monitoring' ? '#218E54' : '#9CA3AF'} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Communauté' && styles.navItemActive]}
          onPress={() => navigateToTab('Communauté', 'Community')}
        >
          <Ionicons 
            name="people" 
            size={28} 
            color={activeTab === 'Communauté' ? '#218E54' : '#9CA3AF'} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'Profil' && styles.navItemActive]}
          onPress={() => navigateToTab('Profil', 'Profile')}
        >
          <Ionicons 
            name="person" 
            size={28} 
            color={activeTab === 'Profil' ? '#218E54' : '#9CA3AF'} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Header redesigné
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Image container avec overlay moderne
  imageContainer: {
    position: 'relative',
    marginTop: 20,
    marginBottom: 20,
  },
  analysisImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  analysisTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 4,
  },
  
  // Carte de diagnostic principale
  diagnosticCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#218E54',
  },
  diagnosticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  diagnosticIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  diagnosticTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },
  diagnosticContent: {
    paddingLeft: 52,
  },
  diagnosticText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
  
  // Cartes de sections
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    paddingLeft: 42,
  },
  
  // Section audio redesignée
  audioSection: {
    marginVertical: 20,
  },
  audioButton: {
    backgroundColor: '#218E54',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  audioIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  audioTextContainer: {
    flex: 1,
  },
  audioButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  audioButtonSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioWave: {
    width: 3,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 1,
    borderRadius: 2,
  },
  audioWaveAnimation: {
    // Animation sera gérée par Animated API si nécessaire
  },
  
  // Bouton stop
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  stopButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  
  // Informations techniques
  technicalInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  technicalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  technicalGrid: {
    gap: 8,
  },
  technicalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  technicalText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  
  // Barre de navigation bottom - SIMPLIFIÉE comme HomeScreen
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 44,
    minHeight: 44,
  },
  navItemActive: {
    backgroundColor: '#F0FDF4',
  },
  
  bottomSpacing: {
    height: 20,
  },
  
  // Styles pour la carte de debug
  debugCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    maxHeight: 200,
  },
});

export default RecapScreen;
