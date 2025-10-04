import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator, Image, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function AdviceAndCulturesScreen() {
  const navigation = useNavigation();
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  

  // Configuration de l'API
  // Pour émulateur Android: utilisez l'IP de votre machine (trouvable avec ifconfig ou ipconfig)
  // Pour appareil physique: utilisez la même IP
  const API_BASE_URL = 'http://192.168.1.100:8000';

  const subjects = [
    { id: 1, name: 'Conseils sur cultures', icon: '🌱', active: true },
    { id: 2, name: 'Diagnostic rapide', icon: '🔍', active: false },
    { id: 3, name: 'Conseils spécialisés', icon: '🌾', active: false },
  ];


  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à vos photos pour cette fonctionnalité.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const sendAdviceRequest = async () => {
    if (!prompt.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre question');
      return;
    }

    setIsLoading(true);
    setResults(null);
    

    try {
      const formData = new FormData();
      
      // Ajouter l'image si sélectionnée
      if (selectedImage) {
        const imageUri = selectedImage.uri;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('file', {
          uri: imageUri,
          type: type,
          name: filename || 'image.jpg',
        });
      }
      
      // Ajouter les données texte
      formData.append('prompt', prompt);
      formData.append('advice_type', 'culture_advice');

      console.log('Envoi de la requête à l\'API...');
      
      const response = await axios.post(`${API_BASE_URL}/api/get-advice/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 30000, // 30 secondes
      });

      console.log('Réponse API reçue:', response.data);
      
      if (response.data) {
        setResults(response.data);
        
        // Afficher une alerte de succès
        Alert.alert(
          'Conseil reçu', 
          'L\'IA a analysé votre demande et fourni des recommandations.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Erreur API:', error);
      
      let errorMessage = 'Erreur lors de la communication avec le serveur';
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que l\'API est démarrée.';
      } else if (error.response) {
        errorMessage = `Erreur serveur: ${error.response.status} - ${error.response.data?.detail || 'Erreur inconnue'}`;
      } else if (error.request) {
        errorMessage = 'Aucune réponse du serveur. Vérifiez votre connexion.';
      }
      
      Alert.alert(
        'Erreur de connexion', 
        errorMessage,
        [
          {
            text: 'Réessayer',
            onPress: () => sendAdviceRequest()
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


  const toggleSubject = (subjectId) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Retour vers l'écran principal approprié
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
          CONSEILS ET CULTURES
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Section Prompt */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#10B981',
            marginBottom: 8,
          }}>
            PROMPT IA
          </Text>
          
          <View style={{
            backgroundColor: '#10B981',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}>
            <Text style={{
              color: 'white',
              fontSize: 14,
              lineHeight: 20,
              marginBottom: 12,
            }}>
              Posez vos questions agricoles. L'intelligence artificielle analysera votre texte et vos images pour des conseils personnalisés et précis.
            </Text>
            
            {/* Image Selection */}
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
              onPress={showImagePicker}
            >
              <Ionicons name="image" size={24} color="white" />
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '500',
                marginLeft: 8,
              }}>
                {selectedImage ? 'Changer l\'image' : 'Ajouter une image (optionnel)'}
              </Text>
            </TouchableOpacity>

            {/* Image Preview */}
            {selectedImage && (
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: 8,
                marginBottom: 12,
                alignItems: 'center',
              }}>
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity onPress={() => setSelectedImage(null)}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    textDecorationLine: 'underline',
                  }}>
                    Supprimer
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Text Input avec placeholder amélioré */}
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
              placeholder="Ex: Mes plants de tomates ont des taches brunes sur les feuilles, que dois-je faire ?"
              placeholderTextColor="#9CA3AF"
              value={prompt}
              onChangeText={setPrompt}
            />

            {/* Send Button amélioré */}
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
              onPress={sendAdviceRequest}
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
                {isLoading ? 'Analyse IA en cours...' : '🚀 Obtenir conseil IA'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Résultats améliorée */}
        {results && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#10B981',
              marginBottom: 8,
            }}>
              📋 CONSEILS IA
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
                  🤖 Réponse de l'IA
                </Text>
              </View>
              
              <Text style={{
                color: 'white',
                fontSize: 14,
                lineHeight: 22,
                marginBottom: 12,
              }}>
                {results.advice}
              </Text>
              
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
                  📊 Image analysée: {results.has_image ? 'Oui' : 'Non'}
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

        {/* Section Sujets */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#10B981',
            marginBottom: 12,
          }}>
            SUJETS
          </Text>
          
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
              }}
              onPress={() => toggleSubject(subject.id)}
            >
              <View style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: selectedSubjects.includes(subject.id) || subject.active ? '#10B981' : '#E5E7EB',
                marginRight: 12,
              }} />
              <Text style={{
                flex: 1,
                fontSize: 14,
                color: '#374151',
              }}>
                {subject.name}
              </Text>
              <Text style={{ fontSize: 16, marginRight: 8 }}>
                {subject.icon}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading Indicator amélioré */}
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
              🧠 L'IA analyse vos données...{'\n'}
              Traitement intelligent en cours
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}