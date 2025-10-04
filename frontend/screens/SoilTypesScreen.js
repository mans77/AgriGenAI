import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator, Image, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { getBackendURL, getFormDataHeaders } from '../config/api';

export default function SoilTypesScreen() {
  const navigation = useNavigation();
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Configuration de l'API avec fallbacks
  const API_BASE_URL = getBackendURL(Platform.OS);
  const FALLBACK_URLS = [
    'http://192.168.1.100:8000',
    'http://10.0.2.2:8000', // Android emulator host
    'http://localhost:8000', // Web/local
    'http://127.0.0.1:8000', // Localhost alternative
  ];

  // Test de connectivité pour trouver une URL qui fonctionne
  const testConnectivity = async () => {
    console.log('🔍 Test de connectivité sur plusieurs URLs...');
    
    for (const testUrl of [API_BASE_URL, ...FALLBACK_URLS]) {
      try {
        console.log(`⚡ Test: ${testUrl}/health`);
        const response = await fetch(`${testUrl}/health`, { 
          method: 'GET',
          timeout: 3000,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (response.ok) {
          console.log(`✅ URL fonctionnelle trouvée: ${testUrl}`);
          return testUrl;
        }
      } catch (error) {
        console.log(`❌ ${testUrl} - ${error.message}`);
      }
    }
    
    console.log('❌ Aucune URL accessible trouvée');
    throw new Error('Aucune URL d\'API accessible');
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à vos photos pour cette fonctionnalité.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Erreur lors de la sélection de l\'image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à votre caméra pour cette fonctionnalité.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Erreur lors de la prise de photo');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Sélectionner une image',
      'Choisissez une source',
      [
        { text: 'Galerie', onPress: pickImage },
        { text: 'Appareil photo', onPress: takePhoto },
        { text: 'Annuler', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const analyzeSoil = async () => {
    if (!selectedImage) {
      Alert.alert('Erreur', 'Veuillez sélectionner une image du sol à analyser');
      return;
    }

    setIsLoading(true);
    setResults(null);

    // Préparer les données FormData en dehors du try/catch pour le fallback
    const formData = new FormData();
    
    // Ajouter l'image
    const imageUri = selectedImage.uri;
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    // @ts-ignore - React Native FormData syntax
    formData.append('file', {
      uri: imageUri,
      type: type,
      name: filename || 'soil.jpg',
    });
    
    // Ajouter les données texte
    formData.append('prompt', prompt || 'Analysez ce sol et donnez-moi des recommandations agricoles détaillées');

    // Tester la connectivité d'abord
    let workingUrl;
    try {
      workingUrl = await testConnectivity();
    } catch (connectError) {
      workingUrl = API_BASE_URL; // Utiliser l'URL par défaut si le test échoue
      console.log('⚠️ Test de connectivité échoué, utilisation de l\'URL par défaut');
    }

    try {

      console.log('Envoi de la requête d\'analyse de sol à l\'API...');
      console.log('URL API:', `${workingUrl}/api/analyze-soil/`);
      console.log('Headers:', getFormDataHeaders());
      
      const response = await fetch(`${workingUrl}/api/analyze-soil/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AgriGenAI-Mobile/2.1.0',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Réponse API reçue:', responseData);
      
      if (responseData && responseData.success) {
        setResults(responseData);
        Alert.alert(
          'Analyse terminée', 
          'L\'IA a analysé votre sol et fourni des recommandations détaillées.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Erreur API:', error);
      
      let errorMessage = 'Erreur lors de l\'analyse du sol';
      
      if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que l\'API backend est démarrée.';
      } else if (error.message.includes('HTTP')) {
        errorMessage = `Erreur serveur: ${error.message}`;
      } else {
        errorMessage = 'Aucune réponse du serveur. Vérifiez votre connexion réseau.';
      }
      
      Alert.alert(
        'Erreur d\'analyse', 
        errorMessage,
        [
          {
            text: 'Réessayer',
            onPress: () => analyzeSoil()
          },
          {
            text: 'Annuler',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // @ts-ignore - Navigation type
      navigation.navigate('Home');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <TouchableOpacity 
          onPress={handleGoBack}
          style={{ padding: 4 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#10B981" />
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 18,
          fontWeight: '600',
          color: '#10B981',
        }}>
          ANALYSE DU SOL
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Section Analyse IA */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#10B981',
            marginBottom: 8,
          }}>
            ANALYSE IA
          </Text>
          
          <View style={{
            backgroundColor: '#10B981',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}>
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 8,
            }}>
              🌱 ANALYSE DE SOL INTELLIGENTE
            </Text>
            <Text style={{
              color: 'white',
              fontSize: 14,
              lineHeight: 20,
              marginBottom: 12,
            }}>
              Photographiez votre sol et obtenez une analyse détaillée avec des recommandations personnalisées grâce à l'intelligence artificielle.
            </Text>
            
            {/* Image Selection - Mise en évidence */}
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.4)',
                borderStyle: 'dashed',
              }}
              onPress={showImagePicker}
            >
              <Ionicons 
                name={selectedImage ? "camera-reverse" : "camera"} 
                size={32} 
                color="white" 
                style={{ marginBottom: 8 }}
              />
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                textAlign: 'center',
                marginBottom: 4,
              }}>
                {selectedImage ? 'Changer la photo du sol' : '📸 AJOUTER PHOTO DU SOL'}
              </Text>
              <Text style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: 13,
                textAlign: 'center',
                fontStyle: 'italic',
              }}>
                {selectedImage ? 'Cliquez pour modifier' : 'Photo obligatoire pour l\'analyse IA'}
              </Text>
            </TouchableOpacity>

            {/* Image Preview - Plus grande */}
            {selectedImage && (
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 14,
                  fontWeight: '500',
                  marginBottom: 12,
                }}>
                  ✅ Photo du sol sélectionnée
                </Text>
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  onPress={() => setSelectedImage(null)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    fontWeight: '500',
                  }}>
                    🗑️ Supprimer la photo
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Text Input */}
            <TextInput
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 16,
              }}
              multiline
              numberOfLines={4}
              placeholder="Ex: Analysez ce sol et donnez-moi des conseils pour cultiver des tomates"
              placeholderTextColor="#9CA3AF"
              value={prompt}
              onChangeText={setPrompt}
            />

            {/* Analyze Button */}
            <TouchableOpacity
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 24,
                alignItems: 'center',
                opacity: isLoading ? 0.7 : 1,
                flexDirection: 'row',
                justifyContent: 'center',
              }}
              onPress={analyzeSoil}
              disabled={isLoading}
            >
              {isLoading && (
                <ActivityIndicator 
                  size="small" 
                  color="#10B981" 
                  style={{ marginRight: 8 }} 
                />
              )}
              <Text style={{
                color: '#10B981',
                fontSize: 16,
                fontWeight: '600',
              }}>
                {isLoading ? 'Analyse IA en cours...' : '🔬 Analyser le sol'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Résultats */}
        {results && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#10B981',
              marginBottom: 8,
            }}>
              📊 ANALYSE DU SOL
            </Text>
            
            <View style={{
              backgroundColor: '#10B981',
              borderRadius: 16,
              padding: 16,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  🤖 Analyse Intelligente du Sol
                </Text>
              </View>
              
              <ScrollView style={{ maxHeight: 400 }}>
                <Text style={{
                  color: 'white',
                  fontSize: 14,
                  lineHeight: 22,
                  marginBottom: 12,
                }}>
                  {results.analysis || results.full_analysis}
                </Text>
              </ScrollView>
              
              {/* Informations supplémentaires */}
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: 8,
              }}>
                <Text style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 12,
                }}>
                  📸 Image analysée: {results.has_image ? 'Oui' : 'Non'}
                </Text>
                {results.timestamp && (
                  <Text style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 12,
                  }}>
                    ⏰ {new Date(results.timestamp).toLocaleString('fr-FR')}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 20,
            alignItems: 'center',
            marginBottom: 24,
          }}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={{
              color: '#6B7280',
              marginTop: 8,
              fontSize: 14,
              textAlign: 'center',
            }}>
              🧠 L'IA analyse votre sol...{'\n'}
              Analyse pédologique en cours
            </Text>
          </View>
        )}

        {/* Section Types de Sols du Sénégal */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#10B981',
            marginBottom: 12,
          }}>
            🗺️ TYPES DE SOLS AU SÉNÉGAL
          </Text>
          
          {/* Sol Ferrugineux */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#DC2626',
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#DC2626',
              marginBottom: 4,
            }}>
              🔴 SOLS FERRUGINEUX TROPICAUX (60% du territoire)
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#6B7280',
              marginBottom: 6,
            }}>
              Couleur: brun-rouge à rouge • pH: 6.0-7.5 • Texture: sableuse à argilo-sableuse
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#374151',
              fontWeight: '500',
            }}>
              🌾 Cultures adaptées: Mil, sorgho, arachide, coton, maïs
            </Text>
          </View>

          {/* Sol Ferralitique */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#F59E0B',
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#F59E0B',
              marginBottom: 4,
            }}>
              🟡 SOLS FERRALITIQUES (Casamance - 20%)
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#6B7280',
              marginBottom: 6,
            }}>
              Couleur: rouge vif à jaune-rouge • pH: 4.5-5.5 • Texture: argileuse
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#374151',
              fontWeight: '500',
            }}>
              🌾 Cultures adaptées: Riz, manguier, agrumes, légumes
            </Text>
          </View>

          {/* Sol Hydromorphe */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#3B82F6',
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#3B82F6',
              marginBottom: 4,
            }}>
              🔵 SOLS HYDROMORPHES (Vallées - 15%)
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#6B7280',
              marginBottom: 6,
            }}>
              Couleur: gris-noir à brun foncé • pH: 5.5-7.0 • Texture: argileuse à limoneuse
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#374151',
              fontWeight: '500',
            }}>
              🌾 Cultures adaptées: Riz, maraîchage de contre-saison
            </Text>
          </View>

          {/* Sol Halomorphe */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor: '#8B5CF6',
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#8B5CF6',
              marginBottom: 4,
            }}>
              🟣 SOLS HALOMORPHES (Zones côtières - 5%)
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#6B7280',
              marginBottom: 6,
            }}>
              Couleur: variable avec taches blanches • pH: 7.5-9.0 • Texture: variable, salée
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#374151',
              fontWeight: '500',
            }}>
              🌾 Cultures adaptées: Riz résistant au sel, cultures tolérantes
            </Text>
          </View>
        </View>

        {/* Section Conseils Généraux */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#10B981',
            marginBottom: 12,
          }}>
            💡 CONSEILS GÉNÉRAUX
          </Text>
          
          <View style={{
            backgroundColor: '#10B981',
            borderRadius: 12,
            padding: 16,
          }}>
            <Text style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '600',
              marginBottom: 12,
            }}>
              📋 RECOMMANDATIONS POUR TOUS TYPES DE SOLS
            </Text>
            
            <View style={{ marginBottom: 12 }}>
              <Text style={{
                color: 'white',
                fontSize: 13,
                fontWeight: '500',
                marginBottom: 4,
              }}>
                💧 GESTION DE L'EAU:
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 12,
                lineHeight: 18,
              }}>
                • Irrigation goutte-à-goutte recommandée{'\n'}
                • Hivernage: juin à octobre{'\n'}
                • Conservation eau de pluie essentielle
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{
                color: 'white',
                fontSize: 13,
                fontWeight: '500',
                marginBottom: 4,
              }}>
                🌱 AMÉLIORATION FERTILITÉ:
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 12,
                lineHeight: 18,
              }}>
                • Matière organique: 2-4 tonnes/ha/an{'\n'}
                • NPK adapté selon culture (15-15-15 général){'\n'}
                • Chaulage si pH inférieur à 5.5
              </Text>
            </View>

            <View>
              <Text style={{
                color: 'white',
                fontSize: 13,
                fontWeight: '500',
                marginBottom: 4,
              }}>
                🔄 ROTATION RECOMMANDÉE:
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 12,
                lineHeight: 18,
              }}>
                Année 1: Céréales (mil, sorgho, maïs){'\n'}
                Année 2: Légumineuses (arachide, niébé){'\n'}
                Année 3: Jachère ou cultures fourragères
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}