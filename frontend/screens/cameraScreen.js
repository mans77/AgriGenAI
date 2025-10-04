import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Image, 
  ImageBackground, 
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { fastRTCService } from '../services/FastRTCService.native';
import { getBackendURL } from '../config/api';

const { width, height } = Dimensions.get('window');

const CameraScreen = () => {
  const navigation = useNavigation();
  const cameraRef = useRef(null);
  
  const [photo, setPhoto] = useState(null);
  const [facing, setFacing] = useState('back');
  const [isLoading, setIsLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Fonction pour tester la connexion à l'API
  const testApiConnection = async () => {
    try {
      console.log("Test de connexion à l'API...");
      const apiUrl = getBackendURL(Platform.OS);
      const response = await axios.get(`${apiUrl}/`, { 
        timeout: 10000 
      });
      console.log("API accessible:", response.data);
      return true;
    } catch (error) {
      console.error("API non accessible:", error.message);
      return false;
    }
  };

  // Test de connexion au chargement du composant
  useEffect(() => {
    testApiConnection();
  }, []);

  if (!permission) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <StatusBar backgroundColor="#10B981" barStyle="light-content" />
        <View style={styles.permissionContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="camera-outline" size={80} color="#10B981" />
          </View>
          <Text style={styles.permissionTitle}>
            Accès à la caméra requis
          </Text>
          <Text style={styles.permissionMessage}>
            Pour analyser vos cultures avec l'IA, nous avons besoin d'accéder à votre caméra
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={requestPermission}
          >
            <Ionicons name="camera" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.permissionButtonText}>
              Autoriser l'accès
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>
              Retour
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const takePhoto = async () => {
    try {
      const data = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      setPhoto(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const sendPhotoToApi = async () => {
    if (!photo?.uri) {
      Alert.alert("Erreur", "URI de la photo invalide");
      return;
    }

    setIsLoading(true);

    try {
      console.log("🚀 Analyse de l'image avec FastRTC...");
      console.log("URI de la photo:", photo.uri);

      // Utiliser FastRTC pour l'analyse optimisée
      const result = await fastRTCService.analyzeImage(photo.uri);
      
      console.log("✅ Résultat d'analyse reçu:", result);
      
      navigation.navigate("Recap", { 
        data: result, 
        image: photo.uri 
      });
      
    } catch (error) {
      console.error("❌ Erreur d'analyse:", error);
      
      let errorMessage = 'Impossible d\'analyser l\'image.';
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage = 'Serveur non accessible. Vérifiez que l\'API est démarrée et votre connexion réseau.';
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        errorMessage = 'Délai d\'attente dépassé. L\'analyse prend trop de temps.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erreur serveur. Vérifiez les logs du serveur.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Format de fichier invalide. Utilisez une image JPEG de qualité.';
      } else {
        errorMessage = `Erreur: ${error.message}`;
      }
      
      Alert.alert('Erreur d\'analyse', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {photo ? 'Aperçu de l\'image' : 'Analyse IA des cultures'}
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      {photo ? (
        /* Preview Mode */
        <View style={styles.previewContainer}>
          <ImageBackground source={{ uri: photo.uri }} style={styles.preview}>
            {/* Overlay info */}
            <View style={styles.previewOverlay}>
              <View style={styles.previewInfo}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.previewInfoText}>
                  Photo capturée • Prête pour l'analyse IA
                </Text>
              </View>
            </View>
          </ImageBackground>

          {/* Preview Controls */}
          <View style={styles.previewControls}>
            <TouchableOpacity 
              style={styles.previewButton} 
              onPress={retakePhoto}
              disabled={isLoading}
            >
              <Ionicons name="camera-outline" size={24} color="#6B7280" />
              <Text style={styles.previewButtonText}>Reprendre</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.analyzeButton, isLoading && styles.analyzeButtonDisabled]} 
              onPress={sendPhotoToApi}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.analyzeButtonText}>Analyse en cours...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="flash" size={24} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.analyzeButtonText}>Analyser avec l'IA</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Camera Mode */
        <View style={{ flex: 1 }}>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
          
          {/* Camera Overlay */}
          <View style={[styles.cameraOverlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}>
            {/* Top Info */}
            <View style={styles.topInfo}>
              <View style={styles.infoCard}>
                <Ionicons name="scan-outline" size={20} color="#10B981" />
                <Text style={styles.infoText}>
                  Positionnez la plante dans le cadre
                </Text>
              </View>
            </View>

            {/* Focus Frame */}
            <View style={styles.focusFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            {/* Bottom Tip */}
            <View style={styles.bottomTip}>
              <Text style={styles.tipText}>
                💡 Conseil : Prenez la photo en plein jour pour de meilleurs résultats
              </Text>
            </View>
          </View>

          {/* Camera Controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse-outline" size={28} color="#10B981" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.captureButton} 
              onPress={takePhoto}
            >
              <View style={styles.captureButtonInner}>
                <Ionicons name="camera" size={32} color="white" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => Alert.alert('Info', 'Fonctionnalité flash bientôt disponible')}
            >
              <Ionicons name="flash-outline" size={28} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  permissionButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topInfo: {
    padding: 20,
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  infoText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  focusFrame: {
    alignSelf: 'center',
    width: width * 0.7,
    height: width * 0.7,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10B981',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomTip: {
    padding: 20,
    alignItems: 'center',
  },
  tipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 32,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
  },
  preview: {
    flex: 1,
    justifyContent: 'space-between',
  },
  previewOverlay: {
    padding: 20,
  },
  previewInfo: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  previewInfoText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: 'rgba(0,0,0,0.9)',
    gap: 16,
  },
  previewButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  previewButtonText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  analyzeButton: {
    flex: 2,
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CameraScreen;
