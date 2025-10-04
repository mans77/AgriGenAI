import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Image, 
  Alert, 
  ActivityIndicator,
  TextInput,
  Modal,
  RefreshControl,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { getBackendURL } from '../config/api';

const API_BASE_URL = getBackendURL(Platform.OS);

export default function PestsAndDiseasesScreen() {
  const navigation = useNavigation();
  
  const [selectedStage, setSelectedStage] = useState('jeune_plant');
  const [diseasesList, setDiseasesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [availableStages, setAvailableStages] = useState([]);
  const [preventionTips, setPreventionTips] = useState({});
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [availablePlants, setAvailablePlants] = useState([]);
  const [showPlantModal, setShowPlantModal] = useState(false);

  // Charger les stades et les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Charger les maladies quand le stade change
  useEffect(() => {
    if (selectedStage) {
      loadDiseasesForStage(selectedStage);
    }
  }, [selectedStage]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      const promises = [
        // Charger les stades disponibles
        axios.get(`${API_BASE_URL}/api/pest-diseases/stages`),
        // Charger les plantes supportées
        axios.get(`${API_BASE_URL}/api/pest-diseases/supported-plants`),
        // Charger les conseils de prévention
        axios.get(`${API_BASE_URL}/api/pest-diseases/prevention-tips`)
      ];
      
      const [stagesResponse, plantsResponse, tipsResponse] = await Promise.all(promises);
      
      setAvailableStages(stagesResponse.data.stages || []);
      setAvailablePlants(plantsResponse.data.plants || []);
      setPreventionTips(tipsResponse.data || {});
      
      // Charger les maladies pour le stade par défaut
      await loadDiseasesForStage(selectedStage);
      
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
      
      // Fallback avec données par défaut correspondant à l'API
      setAvailableStages([
        { id: 1, name: 'jeune_plant', display_name: 'Jeunes plants', icon: '🌱' },
        { id: 2, name: 'vegetatif', display_name: 'Stade végétatif', icon: '🌿' },
        { id: 3, name: 'floraison', display_name: 'Stade de floraison', icon: '🌸' },
        { id: 4, name: 'fructification', display_name: 'Stade de fructification', icon: '🍎' }
      ]);
      
      setAvailablePlants([
        { id: 1, name: 'tomate', icon: '🍅', family: 'Solanacées' },
        { id: 2, name: 'concombre', icon: '🥒', family: 'Cucurbitacées' },
        { id: 3, name: 'pomme de terre', icon: '🥔', family: 'Solanacées' }
      ]);
      
      await loadDiseasesForStage(selectedStage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDiseasesForStage = async (stage) => {
    try {
      setIsLoading(true);
      
      const params = {
        plant_type: selectedPlant?.name
      };
      
      const queryString = selectedPlant?.name ? `?plant_type=${encodeURIComponent(selectedPlant.name)}` : '';
      const response = await axios.get(`${API_BASE_URL}/api/pest-diseases/by-stage/${encodeURIComponent(stage)}${queryString}`);
      
      setDiseasesList(response.data.diseases || []);
      
      // Mettre à jour les conseils de prévention avec ceux spécifiques
      if (response.data.prevention_tips || response.data.plant_tips) {
        setPreventionTips(prev => ({
          ...prev,
          current_stage_tips: response.data.prevention_tips || [],
          current_plant_tips: response.data.plant_tips || []
        }));
      }
      
    } catch (error) {
      console.error('Erreur chargement maladies:', error);
      
      // Fallback vers données locales en cas d'erreur
      const fallbackDiseases = getFallbackDiseases(stage);
      setDiseasesList(fallbackDiseases);
      
    } finally {
      setIsLoading(false);
    }
  };

  const searchDiseases = async () => {
    if (!searchQuery.trim()) {
      loadDiseasesForStage(selectedStage);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const params = {
        q: searchQuery,
        stage: selectedStage
      };
      
      if (selectedPlant?.name) {
        params.plant_type = selectedPlant.name;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/pest-diseases/search`, {
        params
      });
      
      setDiseasesList(response.data.data || []);
      
      // Afficher conseils personnalisés si disponibles
      if (response.data.personalized_tips) {
        setPreventionTips(prev => ({
          ...prev,
          search_tips: response.data.personalized_tips
        }));
      }
      
    } catch (error) {
      console.error('Erreur recherche:', error);
      Alert.alert('Erreur', 'Erreur lors de la recherche');
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackDiseases = (stage) => {
    const fallbackData = {
      'jeune_plant': [
        {
          id: 1,
          common_name: 'Problèmes généraux de croissance',
          description: 'Diverses maladies affectant la croissance générale',
          severity: 'Modérée',
          prevention_tips: ['Surveillance régulière', 'Bonnes pratiques culturales']
        }
      ],
      'vegetatif': [
        {
          id: 3,
          common_name: 'Maladies foliaires',
          description: 'Problèmes affectant les feuilles',
          severity: 'Modérée',
          prevention_tips: ['Circulation d\'air', 'Éviter arrosage foliaire']
        }
      ],
      'floraison': [
        {
          id: 4,
          common_name: 'Maladies florales',
          description: 'Problèmes durant la floraison',
          severity: 'Modérée',
          prevention_tips: ['Protection des fleurs', 'Contrôle humidité']
        }
      ],
      'fructification': [
        {
          id: 5,
          common_name: 'Maladies des fruits',
          description: 'Problèmes affectant les fruits',
          severity: 'Élevée',
          prevention_tips: ['Protection fruits', 'Récolte à temps']
        }
      ]
    };
    
    return fallbackData[stage] || [];
  };

  const handleDiseasePress = async (disease) => {
    try {
      // Essayer de charger les détails complets
      const params = selectedPlant?.name ? `?plant_type=${encodeURIComponent(selectedPlant.name)}` : '';
      const response = await axios.get(`${API_BASE_URL}/api/pest-diseases/disease/${disease.id}${params}`);
      const detailedDisease = response.data;
      
      let alertMessage = `Nom scientifique: ${detailedDisease.scientific_name || 'Non spécifié'}

Sévérité: ${detailedDisease.severity || 'Modérée'}

Description: ${detailedDisease.description || 'Maladie courante des plantes'}

Solution: ${detailedDisease.solution || 'Consulter un expert agricole'}`;
      
      // Ajouter conseils spécifiques à la plante si disponibles
      if (selectedPlant && detailedDisease.plant_specific_advice?.specific_tips) {
        alertMessage += `

Conseils ${selectedPlant.name}: ${detailedDisease.plant_specific_advice.specific_tips.join(', ')}`;
      }
      
      alertMessage += `

Prévention générale: ${(detailedDisease.prevention_tips || []).join(', ')}`;
      
      // Afficher les détails dans une alerte riche
      Alert.alert(
        `${detailedDisease.common_name}`,
        alertMessage,
        [
          { text: 'Plus d\'infos', onPress: () => navigateToDiseasDetails(detailedDisease) },
          { text: 'OK', style: 'default' }
        ]
      );
      
    } catch (error) {
      // Si erreur, afficher les infos de base
      Alert.alert(
        disease.common_name,
        `Description: ${disease.description || 'Maladie commune'}

Sévérité: ${disease.severity || 'Modérée'}

Conseils: ${(disease.prevention_tips || []).join(', ')}`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const navigateToDiseasDetails = (disease) => {
    // Plutôt que de naviguer vers un écran qui n'existe pas, afficher plus d'informations
    Alert.alert(
      `${disease.common_name} - Détails complets`,
      `Nom scientifique: ${disease.scientific_name || 'Non spécifié'}

Symptômes: ${(disease.symptoms || []).join(', ')}

Traitement: ${(disease.treatment || []).join(', ')}

Prévention: ${(disease.prevention || []).join(', ')}

Stades affectés: ${(disease.stage_classification || []).join(', ')}

Plantes hôtes: ${(disease.host || []).join(', ')}`,
      [
        { text: 'Fermer', style: 'default' },
        { 
          text: 'Conseils IA', 
          onPress: () => navigation.navigate('AdviceAndCulturesScreen', { 
            initialPrompt: `J'ai un problème de ${disease.common_name} sur mes plantes. Donnez-moi des conseils détaillés.` 
          })
        }
      ]
    );
  };

  const handleStagePress = (stageName, stageIcon) => {
    navigation.navigate('StageDetails', {
      stageName: stageName,
      stageIcon: stageIcon,
      diseases: diseasesList.filter(d => 
        d.stage_classification?.includes(stageName)
      )
    });
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
    } catch (error) {
      console.error('Erreur refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Élevée': return '#EF4444';
      case 'Modérée': return '#F59E0B';
      case 'Faible': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Élevée': return 'warning';
      case 'Modérée': return 'alert-circle';
      case 'Faible': return 'information-circle';
      default: return 'help-circle';
    }
  };

  const renderDiseaseCard = (disease) => {
    const severityColor = getSeverityColor(disease.severity);
    const severityIcon = getSeverityIcon(disease.severity);

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
          borderLeftWidth: 4,
          borderLeftColor: severityColor,
        }}
        onPress={() => handleDiseasePress(disease)}
      >
        {/* Image ou icône */}
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: `${severityColor}20`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}>
          {disease.images && disease.images[0] ? (
            <Image 
              source={{ uri: disease.images[0].thumbnail }}
              style={{ width: 60, height: 60, borderRadius: 30 }}
              defaultSource={{ uri: 'https://via.placeholder.com/60x60/cccccc/ffffff?text=?' }}
            />
          ) : (
            <Ionicons name={severityIcon} size={32} color={severityColor} />
          )}
        </View>

        {/* Contenu */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
              flex: 1,
            }}>
              {disease.common_name}
            </Text>
            <View style={{
              backgroundColor: severityColor,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
            }}>
              <Text style={{
                color: 'white',
                fontSize: 10,
                fontWeight: '600',
              }}>
                {disease.severity || 'Modérée'}
              </Text>
            </View>
          </View>
          
          <Text style={{
            fontSize: 14,
            color: '#6B7280',
            lineHeight: 20,
            marginBottom: 8,
          }}>
            {disease.description}
          </Text>

          {/* Plantes hôtes */}
          {disease.host && disease.host.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: '#059669', fontWeight: '500' }}>
                Affecte: {disease.host.slice(0, 3).join(', ')}
                {disease.host.length > 3 && '...'}
              </Text>
            </View>
          )}

          {/* Stades affectés */}
          {disease.stage_classification && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {disease.stage_classification.slice(0, 2).map((stage, index) => (
                <View 
                  key={`stage-${disease.id}-${index}`}
                  style={{
                    backgroundColor: '#F3F4F6',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                    marginRight: 4,
                    marginBottom: 2,
                  }}
                >
                  <Text style={{ fontSize: 10, color: '#6B7280' }}>
                    {stage}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color="#10B981" />
      </TouchableOpacity>
    );
  };

  // Modal de sélection de plantes
  const PlantSelectionModal = () => (
    <Modal
      visible={showPlantModal}
      animationType="slide"
      transparent={true}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        paddingHorizontal: 20
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 20,
          maxHeight: '80%'
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#374151'
            }}>
              Choisir une plante
            </Text>
            <TouchableOpacity onPress={() => setShowPlantModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* Option "Toutes les plantes" */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                backgroundColor: !selectedPlant ? '#10B981' : '#F9FAFB',
                borderRadius: 8,
                marginBottom: 8
              }}
              onPress={() => {
                setSelectedPlant(null);
                setShowPlantModal(false);
                loadDiseasesForStage(selectedStage);
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>🌿</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: !selectedPlant ? 'white' : '#374151'
                }}>
                  Toutes les plantes
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: !selectedPlant ? 'rgba(255,255,255,0.8)' : '#6B7280'
                }}>
                  Voir toutes les maladies
                </Text>
              </View>
              {!selectedPlant && (
                <Ionicons name="checkmark" size={20} color="white" />
              )}
            </TouchableOpacity>

            {/* Liste des plantes */}
            {availablePlants.map((plant) => (
              <TouchableOpacity
                key={`plant-${plant.id}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  backgroundColor: selectedPlant?.id === plant.id ? '#10B981' : '#F9FAFB',
                  borderRadius: 8,
                  marginBottom: 8
                }}
                onPress={() => {
                  setSelectedPlant(plant);
                  setShowPlantModal(false);
                  loadDiseasesForStage(selectedStage);
                }}
              >
                <Text style={{ fontSize: 24, marginRight: 12 }}>{plant.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: selectedPlant?.id === plant.id ? 'white' : '#374151',
                    textTransform: 'capitalize'
                  }}>
                    {plant.name}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: selectedPlant?.id === plant.id ? 'rgba(255,255,255,0.8)' : '#6B7280'
                  }}>
                    {plant.family} • {plant.common_diseases_count || 0} maladies
                  </Text>
                </View>
                {selectedPlant?.id === plant.id && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Modal de recherche
  const SearchModal = () => (
    <Modal
      visible={showSearchModal}
      animationType="slide"
      transparent={true}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
      }}>
        <View style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          maxHeight: '80%'
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#374151'
            }}>
              Rechercher une maladie
            </Text>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={{
            flexDirection: 'row',
            backgroundColor: '#F9FAFB',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            alignItems: 'center'
          }}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 16,
                color: '#374151'
              }}
              placeholder="Nom de la maladie ou symptômes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                searchDiseases();
                setShowSearchModal(false);
              }}
            />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#10B981',
              borderRadius: 8,
              padding: 12,
              alignItems: 'center'
            }}
            onPress={() => {
              searchDiseases();
              setShowSearchModal(false);
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600'
            }}>
              Rechercher
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
          RAVAGEURS ET MALADIES
        </Text>
        <TouchableOpacity 
          onPress={() => setShowSearchModal(true)}
          style={{ padding: 4 }}
        >
          <Ionicons name="search" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1, padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Section Sélection de plante */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 12,
          }}>
            Filtrer par plante (optionnel)
          </Text>
          
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              borderWidth: 2,
              borderColor: selectedPlant ? '#10B981' : '#E5E7EB',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
            onPress={() => setShowPlantModal(true)}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>
              {selectedPlant ? selectedPlant.icon : '🌿'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#374151',
                textTransform: 'capitalize'
              }}>
                {selectedPlant ? selectedPlant.name : 'Toutes les plantes'}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                {selectedPlant 
                  ? `${selectedPlant.family} • Conseils personnalisés`
                  : 'Appuyez pour filtrer par type de plante'
                }
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Section Stades de croissance */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 12,
          }}>
            Maladies par stades de croissance
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
            directionalLockEnabled={true}
            pagingEnabled={false}
            decelerationRate="fast"
            snapToAlignment="start"
            snapToInterval={120} // Ajuster selon la largeur des éléments
            style={{ 
              flexGrow: 0,
              marginHorizontal: -4 // Compensation pour le padding
            }}
            contentContainerStyle={{
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 8,
              gap: 8, // Espacement uniforme entre les éléments
            }}
          >
            {availableStages.map((stage, index) => (
              <TouchableOpacity
                key={`stage-selector-${stage.id}`}
                style={{
                  backgroundColor: selectedStage === stage.name ? '#10B981' : '#E5E7EB',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 25,
                  flexDirection: 'row',
                  alignItems: 'center',
                  minWidth: 140,
                  maxWidth: 180,
                  justifyContent: 'center',
                  shadowColor: selectedStage === stage.name ? '#10B981' : '#000',
                  shadowOffset: { 
                    width: 0, 
                    height: selectedStage === stage.name ? 4 : 2 
                  },
                  shadowOpacity: selectedStage === stage.name ? 0.3 : 0.1,
                  shadowRadius: selectedStage === stage.name ? 6 : 3,
                  elevation: selectedStage === stage.name ? 6 : 3,
                  transform: [{ 
                    scale: selectedStage === stage.name ? 1.05 : 1 
                  }],
                }}
                onPress={() => setSelectedStage(stage.name)}
                onLongPress={() => handleStagePress(stage.name, stage.icon)}
                activeOpacity={0.7}
              >
                <Text style={{ 
                  marginRight: 6, 
                  fontSize: 18,
                }}>
                  {stage.icon}
                </Text>
                <Text style={{
                  color: selectedStage === stage.name ? 'white' : '#374151',
                  fontWeight: selectedStage === stage.name ? '600' : '500',
                  fontSize: 13,
                  textAlign: 'center',
                  flexShrink: 1,
                }}>
                  {stage.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Indicateur de défilement personnalisé */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 12,
            gap: 4,
          }}>
            {availableStages.map((stage, index) => (
              <View
                key={`indicator-${stage.id}-${index}`}
                style={{
                  width: selectedStage === stage.name ? 8 : 6,
                  height: selectedStage === stage.name ? 8 : 6,
                  borderRadius: 4,
                  backgroundColor: selectedStage === stage.name ? '#10B981' : '#D1D5DB',
                }}
              />
            ))}
          </View>
          
          {/* Aide au défilement */}
          <Text style={{
            fontSize: 12,
            color: '#9CA3AF',
            textAlign: 'center',
            marginTop: 4,
            fontStyle: 'italic'
          }}>
            👆 Glissez pour voir tous les stades • Appui long pour plus d'infos
          </Text>
        </View>

        {/* Section Maladies et Ravageurs */}
        <View style={{ marginBottom: 24 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
            }}>
              {selectedStage}{selectedPlant ? ` - ${selectedPlant.name}` : ''} • {diseasesList.length} maladie(s)
            </Text>
            {searchQuery && (
              <TouchableOpacity 
                onPress={() => {
                  setSearchQuery('');
                  loadDiseasesForStage(selectedStage);
                }}
                style={{
                  backgroundColor: '#EF4444',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6
                }}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>
                  Effacer recherche
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 40,
            }}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={{
                color: '#6B7280',
                marginTop: 8,
                fontSize: 14,
              }}>
                {searchQuery ? 'Recherche en cours...' : 'Chargement des maladies...'}
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
                  padding: 20,
                  alignItems: 'center',
                }}>
                  <Ionicons name="search" size={48} color="#D1D5DB" />
                  <Text style={{
                    color: '#6B7280',
                    fontSize: 16,
                    textAlign: 'center',
                    marginTop: 8,
                  }}>
                    {searchQuery 
                      ? `Aucune maladie trouvée pour "${searchQuery}"`
                      : 'Aucune maladie répertoriée pour ce stade'
                    }
                  </Text>
                  {searchQuery && (
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#10B981',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                        marginTop: 12
                      }}
                      onPress={() => {
                        setSearchQuery('');
                        loadDiseasesForStage(selectedStage);
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 14 }}>
                        Voir toutes les maladies
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Conseils de prévention personnalisés */}
        {(preventionTips.current_stage_tips?.length > 0 || preventionTips.current_plant_tips?.length > 0 || (preventionTips.by_stage && preventionTips.by_stage[selectedStage])) && (
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderLeftWidth: 4,
            borderLeftColor: selectedPlant ? '#3B82F6' : '#10B981',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="shield-checkmark" size={20} color={selectedPlant ? '#3B82F6' : '#10B981'} />
              <Text style={{
                color: selectedPlant ? '#3B82F6' : '#10B981',
                fontWeight: '600',
                marginLeft: 8,
                fontSize: 16,
              }}>
                Conseils de prévention{selectedPlant ? ` - ${selectedPlant.name}` : ` - ${selectedStage}`}
              </Text>
            </View>
            
            {/* Conseils spécifiques à la plante */}
            {preventionTips.current_plant_tips?.length > 0 && (
              <>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Spécifique à {selectedPlant?.name}:</Text>
                {preventionTips.current_plant_tips.map((tip, index) => (
                  <Text key={`plant-tip-${selectedPlant?.id}-${index}`} style={{
                    color: '#6B7280',
                    fontSize: 14,
                    lineHeight: 20,
                    marginBottom: 4,
                    marginLeft: 8
                  }}>
                    • {tip}
                  </Text>
                ))}
              </>
            )}
            
            {/* Conseils spécifiques au stade */}
            {preventionTips.current_stage_tips?.length > 0 && (
              <>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 8 }}>Stade {selectedStage}:</Text>
                {preventionTips.current_stage_tips.map((tip, index) => (
                  <Text key={`stage-tip-${selectedStage}-${index}`} style={{
                    color: '#6B7280',
                    fontSize: 14,
                    lineHeight: 20,
                    marginBottom: 4,
                    marginLeft: 8
                  }}>
                    • {tip}
                  </Text>
                ))}
              </>
            )}
            
            {/* Conseils généraux du stade (fallback) */}
            {!preventionTips.current_stage_tips?.length && !preventionTips.current_plant_tips?.length && preventionTips.by_stage && preventionTips.by_stage[selectedStage] && (
              preventionTips.by_stage[selectedStage].map((tip, index) => (
                <Text key={`general-tip-${selectedStage}-${index}`} style={{
                  color: '#6B7280',
                  fontSize: 14,
                  lineHeight: 20,
                  marginBottom: 4,
                }}>
                  • {tip}
                </Text>
              ))
            )}
          </View>
        )}

        {/* Information supplémentaire */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          borderLeftWidth: 4,
          borderLeftColor: '#F59E0B',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="information-circle" size={20} color="#F59E0B" />
            <Text style={{
              color: '#F59E0B',
              fontWeight: '600',
              marginLeft: 8,
              fontSize: 16,
            }}>
              Conseil d'expert
            </Text>
          </View>
          <Text style={{
            color: '#6B7280',
            fontSize: 14,
            lineHeight: 20,
          }}>
            La prévention reste la meilleure approche. Surveillez régulièrement vos cultures et agissez dès les premiers symptômes pour éviter la propagation des maladies. N'hésitez pas à photographier les symptômes pour un diagnostic plus précis.
          </Text>
        </View>

        {/* Actions rapides */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 20
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#3B82F6',
              flex: 1,
              marginRight: 8,
              borderRadius: 8,
              padding: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
            onPress={() => navigation.navigate('Camera', { mode: 'disease_diagnosis' })}
          >
            <Ionicons name="camera" size={16} color="white" />
            <Text style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '600',
              marginLeft: 4
            }}>
              Diagnostic photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#8B5CF6',
              flex: 1,
              marginLeft: 8,
              borderRadius: 8,
              padding: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
            onPress={() => handleStagePress(selectedStage, availableStages.find(s => s.name === selectedStage)?.icon)}
          >
            <Ionicons name="library" size={16} color="white" />
            <Text style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '600',
              marginLeft: 4
            }}>
              Guide complet
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PlantSelectionModal />
      <SearchModal />
    </SafeAreaView>
  );
}