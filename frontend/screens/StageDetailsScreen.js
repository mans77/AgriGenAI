import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';

export default function StageDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { stageName, stageIcon } = route.params || { 
    stageName: 'Stade de fructification', 
    stageIcon: '🍎' 
  };
  
  const [diseasesList, setDiseasesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Données simulées spécifiques au stade de fructification
  const mockStageData = {
    'Stade de fructification': [
      {
        id: 1,
        name: 'Pourriture des fruits',
        description: 'Maladie fongique causant la dégradation des fruits mûrs',
        image: 'https://via.placeholder.com/80x80/ef4444/ffffff?text=🍎',
        symptoms: ['Taches brunes sur fruits', 'Ramollissement', 'Odeur de fermentation'],
        treatment: ['Élimination fruits atteints', 'Traitement fongicide', 'Amélioration ventilation'],
        prevention: ['Récolte à maturité optimale', 'Stockage dans lieu sec'],
        severity: 'Élevé',
        affectedCrops: ['Tomate', 'Mangue', 'Papaye', 'Banane']
      },
      {
        id: 2,
        name: 'Mouche des fruits',
        description: 'Insecte ravageur qui pond ses œufs dans les fruits',
        image: 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=🪰',
        symptoms: ['Piqûres sur fruits', 'Présence d\'asticots', 'Chute prématurée'],
        treatment: ['Pièges à phéromones', 'Insecticide naturel', 'Filets de protection'],
        prevention: ['Ramassage fruits tombés', 'Pièges préventifs'],
        severity: 'Moyen',
        affectedCrops: ['Mangue', 'Goyave', 'Papaye', 'Agrumes']
      },
      {
        id: 3,
        name: 'Anthracnose',
        description: 'Champignon provoquant des taches noires sur fruits mûrs',
        image: 'https://via.placeholder.com/80x80/059669/ffffff?text=🫐',
        symptoms: ['Taches circulaires noires', 'Dépression sur fruit', 'Extension rapide'],
        treatment: ['Fongicide cuivré', 'Élimination parties atteintes', 'Traitement préventif'],
        prevention: ['Éviter blessures fruits', 'Récolte par temps sec'],
        severity: 'Élevé',
        affectedCrops: ['Mangue', 'Avocat', 'Banane', 'Papaye']
      },
      {
        id: 4,
        name: 'Cochenilles des fruits',
        description: 'Petits insectes suceurs affaiblissant les fruits',
        image: 'https://via.placeholder.com/80x80/7c3aed/ffffff?text=🐛',
        symptoms: ['Taches blanches', 'Déformation fruits', 'Affaiblissement plant'],
        treatment: ['Savon noir', 'Huile de neem', 'Alcool à 70°'],
        prevention: ['Contrôle régulier', 'Élimination fourmis'],
        severity: 'Moyen',
        affectedCrops: ['Agrumes', 'Mangue', 'Avocat']
      },
      {
        id: 5,
        name: 'Mildiou des fruits',
        description: 'Maladie cryptogamique affectant les fruits en formation',
        image: 'https://via.placeholder.com/80x80/10b981/ffffff?text=🍃',
        symptoms: ['Duvet grisâtre', 'Taches huileuses', 'Déformation fruits'],
        treatment: ['Bouillie bordelaise', 'Élimination fruits atteints', 'Amélioration circulation air'],
        prevention: ['Éviter arrosage sur feuillage', 'Espacement plants'],
        severity: 'Élevé',
        affectedCrops: ['Tomate', 'Aubergine', 'Poivron']
      }
    ]
  };

  useEffect(() => {
    loadStageDetails();
  }, []);

  const loadStageDetails = () => {
    setIsLoading(true);
    
    // Simulation du chargement des données
    setTimeout(() => {
      const stageData = mockStageData[stageName] || [];
      setDiseasesList(stageData);
      setIsLoading(false);
    }, 800);
  };

  const handleDiseasePress = (disease) => {
    Alert.alert(
      disease.name,
      `Description: ${disease.description}\n\nSymptômes:\n${disease.symptoms.map(s => `• ${s}`).join('\n')}\n\nTraitement:\n${disease.treatment.map(t => `• ${t}`).join('\n')}\n\nPrévention:\n${disease.prevention.map(p => `• ${p}`).join('\n')}\n\nCultures affectées: ${disease.affectedCrops.join(', ')}`,
      [
        { text: 'Fermer', style: 'cancel' },
        { text: 'En savoir plus', onPress: () => getMoreInfo(disease) }
      ]
    );
  };

  const getMoreInfo = (disease) => {
    // Navigation vers écran détaillé ou ouverture d'un lien externe
    Alert.alert(
      'Plus d\'informations',
      `Vous allez être redirigé vers des ressources détaillées sur ${disease.name}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Continuer', onPress: () => {
          // Ici on pourrait ouvrir un lien web ou naviguer vers un écran détaillé
          console.log(`Ouverture des détails pour: ${disease.name}`);
        }}
      ]
    );
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Faible': return '#10B981';
      case 'Moyen': return '#F59E0B';
      case 'Élevé': return '#EF4444';
      case 'Critique': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const renderDiseaseCard = (disease) => {
    return (
      <TouchableOpacity
        key={disease.id}
        style={{
          backgroundColor: 'white',
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        onPress={() => handleDiseasePress(disease)}
      >
        {/* Image de la maladie */}
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 8,
          backgroundColor: '#F3F4F6',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
          overflow: 'hidden',
        }}>
          <Image
            source={{ uri: disease.image }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>

        {/* Informations de la maladie */}
        <View style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 4,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
              flex: 1,
            }}>
              {disease.name}
            </Text>
            <View style={{
              backgroundColor: getSeverityColor(disease.severity),
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 8,
              marginLeft: 8,
            }}>
              <Text style={{
                color: 'white',
                fontSize: 10,
                fontWeight: '600',
              }}>
                {disease.severity}
              </Text>
            </View>
          </View>
          
          <Text style={{
            fontSize: 14,
            color: '#6B7280',
            lineHeight: 18,
            marginBottom: 8,
          }}>
            {disease.description}
          </Text>

          {/* Cultures affectées */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <Ionicons name="leaf" size={14} color="#10B981" />
            <Text style={{
              fontSize: 12,
              color: '#10B981',
              marginLeft: 4,
              fontWeight: '500',
            }}>
              {disease.affectedCrops.slice(0, 3).join(', ')}
              {disease.affectedCrops.length > 3 ? '...' : ''}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#10B981" />
      </TouchableOpacity>
    );
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
        <View style={{
          flex: 1,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#10B981',
            marginRight: 8,
          }}>
            {stageName.toUpperCase()}
          </Text>
          <Text style={{ fontSize: 20 }}>{stageIcon}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Informations sur le stade */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderLeftWidth: 4,
          borderLeftColor: '#10B981',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>{stageIcon}</Text>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#10B981',
            }}>
              À propos de ce stade
            </Text>
          </View>
          <Text style={{
            fontSize: 14,
            color: '#6B7280',
            lineHeight: 20,
          }}>
            Le {stageName.toLowerCase()} est une période critique où les fruits se développent et mûrissent. 
            C'est à ce moment que plusieurs maladies et ravageurs peuvent affecter la qualité et le rendement de vos récoltes.
          </Text>
        </View>

        {/* Liste des maladies */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 16,
          }}>
            Maladies et ravageurs courants ({diseasesList.length})
          </Text>

          {isLoading ? (
            <View style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 40,
              alignItems: 'center',
            }}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={{
                color: '#6B7280',
                marginTop: 12,
                fontSize: 14,
              }}>
                Chargement des maladies...
              </Text>
            </View>
          ) : (
            <View>
              {diseasesList.length > 0 ? (
                diseasesList.map((disease) => renderDiseaseCard(disease))
              ) : (
                <View style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 40,
                  alignItems: 'center',
                }}>
                  <Ionicons name="leaf" size={48} color="#E5E7EB" />
                  <Text style={{
                    color: '#6B7280',
                    fontSize: 16,
                    textAlign: 'center',
                    marginTop: 12,
                  }}>
                    Aucune maladie répertoriée pour ce stade
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Conseils préventifs */}
        <View style={{
          backgroundColor: '#F0FDF4',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderLeftWidth: 4,
          borderLeftColor: '#10B981',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={{
              color: '#10B981',
              fontWeight: '600',
              marginLeft: 8,
              fontSize: 16,
            }}>
              Conseils préventifs généraux
            </Text>
          </View>
          <Text style={{
            color: '#374151',
            fontSize: 14,
            lineHeight: 20,
          }}>
            • Surveillez régulièrement l'état de vos fruits{'\n'}
            • Maintenez une bonne hygiène dans vos parcelles{'\n'}
            • Récoltez à maturité optimale{'\n'}
            • Éliminez rapidement les fruits atteints{'\n'}
            • Assurez une bonne circulation de l'air
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}