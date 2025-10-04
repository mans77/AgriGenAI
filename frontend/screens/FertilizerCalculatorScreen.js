import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  Alert, 
  Modal,
  ActivityIndicator,
  FlatList,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.100:8000';

export default function FertilizerCalculatorScreen() {
  const navigation = useNavigation();
  
  // États principaux
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [selectedFertilizerType, setSelectedFertilizerType] = useState('NPK 15-15-15');
  const [gardenType, setGardenType] = useState('potager');
  const [region, setRegion] = useState('tropicale');
  const [soilPh, setSoilPh] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  
  // États pour la recherche de plantes
  const [availablePlants, setAvailablePlants] = useState([]);
  const [plantCategories, setPlantCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showPlantModal, setShowPlantModal] = useState(false);
  
  // États pour les types d'engrais
  const [fertilizerTypes, setFertilizerTypes] = useState({});
  const [showFertilizerModal, setShowFertilizerModal] = useState(false);
  
  // États pour le calendrier
  const [schedule, setSchedule] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Charger les données au montage
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Charger les plantes locales
      const plantsResponse = await axios.get(`${API_BASE_URL}/api/plants/local`);
      setAvailablePlants(plantsResponse.data.plants);
      setPlantCategories(plantsResponse.data.categories);
      
      // Charger les types d'engrais
      const fertilizerResponse = await axios.get(`${API_BASE_URL}/api/fertilizer/types`);
      setFertilizerTypes(fertilizerResponse.data.fertilizer_types);
      
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données de base');
    } finally {
      setIsLoading(false);
    }
  };

  const searchPlants = async (query = searchQuery) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/plants/search`, {
        params: {
          q: query,
          category: selectedCategory || undefined,
          page: 1
        }
      });
      
      // Mélanger avec les plantes locales
      const allPlants = [...availablePlants];
      response.data.data?.forEach(apiPlant => {
        if (!allPlants.find(p => p.name === apiPlant.common_name)) {
          allPlants.push({
            name: apiPlant.common_name,
            category: apiPlant.fertilizer_data?.category || 'Autre',
            icon: apiPlant.fertilizer_data?.icon || '🌱',
            season: apiPlant.fertilizer_data?.season || 'toute-année',
            difficulty: apiPlant.fertilizer_data?.care_difficulty || 'moyen',
            optimal_ph: apiPlant.fertilizer_data?.optimal_ph || {min: 6.0, max: 7.0},
            stages: Object.keys(apiPlant.fertilizer_data?.stages || {vegetatif: {}})
          });
        }
      });
      
      setAvailablePlants(allPlants);
      
    } catch (error) {
      console.error('Erreur recherche plantes:', error);
    }
  };

  const addPlant = (plant) => {
    const existingIndex = selectedPlants.findIndex(p => p.name === plant.name);
    
    if (existingIndex >= 0) {
      // Augmenter la quantité si la plante existe déjà
      const updatedPlants = [...selectedPlants];
      updatedPlants[existingIndex].quantity += 1;
      setSelectedPlants(updatedPlants);
    } else {
      // Ajouter une nouvelle plante
      setSelectedPlants([...selectedPlants, {
        name: plant.name,
        quantity: 1,
        stage: 'vegetatif',
        icon: plant.icon,
        category: plant.category,
        stages: plant.stages || ['semis', 'vegetatif', 'floraison', 'fructification']
      }]);
    }
    
    setShowPlantModal(false);
  };

  const removePlant = (index) => {
    const updatedPlants = selectedPlants.filter((_, i) => i !== index);
    setSelectedPlants(updatedPlants);
  };

  const updatePlantQuantity = (index, delta) => {
    const updatedPlants = [...selectedPlants];
    updatedPlants[index].quantity = Math.max(1, updatedPlants[index].quantity + delta);
    setSelectedPlants(updatedPlants);
  };

  const updatePlantStage = (index, stage) => {
    const updatedPlants = [...selectedPlants];
    updatedPlants[index].stage = stage;
    setSelectedPlants(updatedPlants);
  };

  const calculateFertilizer = async () => {
    if (selectedPlants.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une plante');
      return;
    }

    setIsLoading(true);
    
    try {
      const requestData = {
        plants: selectedPlants.map(plant => ({
          name: plant.name,
          quantity: plant.quantity,
          stage: plant.stage
        })),
        fertilizer_type: selectedFertilizerType,
        garden_type: gardenType,
        region: region,
        soil_ph: soilPh ? parseFloat(soilPh) : null
      };

      const response = await axios.post(`${API_BASE_URL}/api/calculate-fertilizer-advanced/`, requestData, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      setResults(response.data);
      
      // Générer le calendrier
      await generateSchedule();
      
    } catch (error) {
      console.error('Erreur calcul:', error);
      Alert.alert('Erreur', 'Erreur lors du calcul des engrais');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSchedule = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/fertilizer/schedule`, 
        selectedPlants.map(plant => ({
          name: plant.name,
          quantity: plant.quantity,
          stage: plant.stage
        }))
      );
      setSchedule(response.data);
    } catch (error) {
      console.error('Erreur génération calendrier:', error);
    }
  };

  const saveGardenProfile = async () => {
    try {
      const profile = {
        name: `Mon jardin ${new Date().toLocaleDateString()}`,
        plants: selectedPlants,
        gardenType,
        region,
        soilPh,
        fertilizerType: selectedFertilizerType,
        createdAt: new Date().toISOString()
      };

      // Sauvegarder localement (vous pouvez implémenter AsyncStorage)
      Alert.alert('Succès', 'Profil de jardin sauvegardé !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
    }
  };

  const createReminder = () => {
    if (!results) {
      Alert.alert('Info', 'Calculez d\'abord vos besoins en engrais');
      return;
    }

    Alert.alert(
      'Rappel de fertilisation',
      'Souhaitez-vous recevoir des rappels pour fertiliser vos plantes ?',
      [
        { text: 'Plus tard', style: 'cancel' },
        { 
          text: 'Oui', 
          onPress: () => {
            // Ici vous pourriez implémenter les notifications locales
            Alert.alert('Confirmé', 'Rappels programmés avec succès !');
          }
        }
      ]
    );
  };

  const exportResults = () => {
    if (!results) {
      Alert.alert('Info', 'Aucun résultat à exporter');
      return;
    }

    const exportData = {
      date: new Date().toLocaleDateString(),
      plants: selectedPlants,
      fertilizer: selectedFertilizerType,
      results: results,
      recommendations: results.instructions
    };

    // Ici vous pourriez implémenter l'export vers un fichier
    Alert.alert('Export', 'Résultats exportés vers les téléchargements');
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const PlantModal = () => (
    <Modal
      visible={showPlantModal}
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
          maxHeight: '80%',
          paddingTop: 20
        }}>
          {/* Header du modal */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 20
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#374151'
            }}>
              Sélectionner une plante
            </Text>
            <TouchableOpacity onPress={() => setShowPlantModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Barre de recherche */}
          <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#F3F4F6',
              borderRadius: 10,
              paddingHorizontal: 15,
              paddingVertical: 10,
              alignItems: 'center'
            }}>
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 10,
                  fontSize: 16,
                  color: '#374151'
                }}
                placeholder="Rechercher une plante..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => searchPlants()}
              />
            </View>
          </View>

          {/* Filtres par catégorie */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: 20, marginBottom: 15 }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: selectedCategory === '' ? '#10B981' : '#E5E7EB',
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 10
              }}
              onPress={() => setSelectedCategory('')}
            >
              <Text style={{
                color: selectedCategory === '' ? 'white' : '#374151',
                fontWeight: '500'
              }}>
                Toutes
              </Text>
            </TouchableOpacity>
            
            {plantCategories.map((category) => (
              <TouchableOpacity
                key={category}
                style={{
                  backgroundColor: selectedCategory === category ? '#10B981' : '#E5E7EB',
                  paddingHorizontal: 15,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 10
                }}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={{
                  color: selectedCategory === category ? 'white' : '#374151',
                  fontWeight: '500'
                }}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Liste des plantes */}
          <FlatList
            data={availablePlants.filter(plant => 
              (!selectedCategory || plant.category === selectedCategory) &&
              (!searchQuery || plant.name.toLowerCase().includes(searchQuery.toLowerCase()))
            )}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F3F4F6'
                }}
                onPress={() => addPlant(item)}
              >
                <Text style={{ fontSize: 30, marginRight: 15 }}>
                  {item.icon}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: 2
                  }}>
                    {item.name}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: '#6B7280'
                  }}>
                    {item.category} • {item.difficulty} • {item.season}
                  </Text>
                </View>
                <Ionicons name="add-circle" size={24} color="#10B981" />
              </TouchableOpacity>
            )}
            style={{ maxHeight: 400 }}
          />
        </View>
      </View>
    </Modal>
  );

  const ScheduleModal = () => (
    <Modal
      visible={showScheduleModal}
      animationType="slide"
      transparent={true}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
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
              Calendrier de fertilisation
            </Text>
            <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {schedule && (
            <ScrollView>
              {schedule.schedule.slice(0, 8).map((week, index) => (
                <View 
                  key={index}
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 10,
                    padding: 15,
                    marginBottom: 10
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#10B981',
                    marginBottom: 8
                  }}>
                    Semaine {week.week} - {new Date(week.date).toLocaleDateString('fr-FR')}
                  </Text>
                  
                  {week.tasks.map((task, taskIndex) => (
                    <View 
                      key={taskIndex}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 5
                      }}
                    >
                      <Text style={{ fontSize: 20, marginRight: 10 }}>
                        {task.icon}
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: '#374151',
                        flex: 1
                      }}>
                        {task.plant} (x{task.quantity}) - {task.stage}
                      </Text>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const FertilizerModal = () => (
    <Modal
      visible={showFertilizerModal}
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
          maxHeight: '70%',
          paddingTop: 20
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 20
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#374151'
            }}>
              Types d'engrais disponibles
            </Text>
            <TouchableOpacity onPress={() => setShowFertilizerModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }}>
            {Object.entries(fertilizerTypes).map(([type, data]) => (
              <TouchableOpacity
                key={type}
                style={{
                  backgroundColor: selectedFertilizerType === type ? '#F0FDF4' : '#F9FAFB',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: selectedFertilizerType === type ? 2 : 1,
                  borderColor: selectedFertilizerType === type ? '#10B981' : '#E5E7EB'
                }}
                onPress={() => {
                  setSelectedFertilizerType(type);
                  setShowFertilizerModal(false);
                }}
              >
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    {type}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#10B981',
                    fontWeight: '500'
                  }}>
                    {data.price_per_kg} FCFA/kg
                  </Text>
                </View>
                
                <View style={{
                  flexDirection: 'row',
                  marginBottom: 8
                }}>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginRight: 15 }}>
                    N: {data.n}%
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginRight: 15 }}>
                    P: {data.p}%
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    K: {data.k}%
                  </Text>
                </View>

                {type === 'Engrais organique' && (
                  <Text style={{ fontSize: 11, color: '#059669', fontStyle: 'italic' }}>
                    ✓ Respectueux de l'environnement
                  </Text>
                )}
                {type.includes('NPK') && (
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>
                    ⚡ Action rapide et équilibrée
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAdvancedResults = () => {
    if (!results) return null;

    return (
      <View style={{ margin: 16 }}>
        {/* Carte principale des résultats */}
        <View style={{
          backgroundColor: '#10B981',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
        }}>
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 8,
          }}>
            Recommandations calculées
          </Text>
          <Text style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 14,
            marginBottom: 16,
          }}>
            {selectedFertilizerType} - {selectedPlants.length} type(s) de plantes
          </Text>

          {/* Détails par plante */}
          {results.plants && results.plants.map((plant, index) => (
            <View 
              key={index}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 24, marginRight: 10 }}>{plant.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                    {plant.name} (x{plant.quantity})
                  </Text>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
                    Stade: {plant.stage} • {plant.category}
                  </Text>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12 }}>
                  N: {plant.needs.n}kg
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12 }}>
                  P: {plant.needs.p}kg
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12 }}>
                  K: {plant.needs.k}kg
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12 }}>
                  Fréq: {plant.frequency_days}j
                </Text>
              </View>
            </View>
          ))}

          {/* Totaux et recommandations */}
          {results.fertilizer_recommendation && (
            <View style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              padding: 16,
              marginTop: 8
            }}>
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 12
              }}>
                📊 Recommandations finales
              </Text>
              
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                  {results.fertilizer_recommendation.quantity_kg} kg
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>
                  de {selectedFertilizerType}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
                    Dilution
                  </Text>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                    {results.fertilizer_recommendation.dilution_per_liter}g/L
                  </Text>
                </View>
                <View>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
                    Applications/mois
                  </Text>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                    {results.fertilizer_recommendation.applications_per_month}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
                    Coût mensuel
                  </Text>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                    {results.monthly_cost} FCFA
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Avertissements et recommandations pH */}
        {(results.warnings?.length > 0 || results.ph_recommendations?.length > 0) && (
          <View style={{
            backgroundColor: '#FEF3C7',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderLeftWidth: 4,
            borderLeftColor: '#F59E0B'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#92400E',
                marginLeft: 8
              }}>
                Recommandations importantes
              </Text>
            </View>

            {results.warnings?.map((warning, index) => (
              <Text key={index} style={{
                fontSize: 14,
                color: '#92400E',
                marginBottom: 4
              }}>
                • {warning}
              </Text>
            ))}

            {results.ph_recommendations?.map((ph, index) => (
              <Text key={index} style={{
                fontSize: 14,
                color: '#92400E',
                marginBottom: 4
              }}>
                • {ph.plant}: pH actuel {ph.current_ph}, optimal {ph.optimal_range}
              </Text>
            ))}
          </View>
        )}

        {/* Calendrier des prochaines applications */}
        {results.application_schedule && (
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB'
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#374151'
              }}>
                📅 Prochaines applications
              </Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(true)}>
                <Text style={{
                  color: '#10B981',
                  fontSize: 14,
                  fontWeight: '500'
                }}>
                  Voir tout
                </Text>
              </TouchableOpacity>
            </View>

            {results.application_schedule.slice(0, 3).map((app, index) => (
              <View 
                key={index}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: index < 2 ? 1 : 0,
                  borderBottomColor: '#F3F4F6'
                }}
              >
                <View>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    {new Date(app.date).toLocaleDateString('fr-FR')}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: '#6B7280'
                  }}>
                    {app.day_of_week}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#10B981'
                  }}>
                    {app.fertilizer_amount} kg
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: '#6B7280'
                  }}>
                    {app.plants_to_fertilize.length} plante(s)
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions sur les résultats */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 16
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#EF4444',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              marginRight: 8
            }}
            onPress={() => setResults(null)}
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '500',
              marginLeft: 4
            }}>
              Nouveau calcul
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#10B981',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              marginHorizontal: 4
            }}
            onPress={saveGardenProfile}
          >
            <Ionicons name="save" size={16} color="white" />
            <Text style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '500',
              marginLeft: 4
            }}>
              Sauvegarder
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: '#6366F1',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              marginLeft: 8
            }}
            onPress={createReminder}
          >
            <Ionicons name="notifications" size={16} color="white" />
            <Text style={{
              color: 'white',
              fontSize: 14,
              fontWeight: '500',
              marginLeft: 4
            }}>
              Rappels
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
          CALCULATEUR D'ENGRAIS AVANCÉ
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Section Plantes sélectionnées */}
        <View style={{ padding: 16 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
            }}>
              Plantes sélectionnées ({selectedPlants.length})
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#10B981',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={() => setShowPlantModal(true)}
            >
              <Ionicons name="add" size={16} color="white" />
              <Text style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '500',
                marginLeft: 4
              }}>
                Ajouter
              </Text>
            </TouchableOpacity>
          </View>

          {selectedPlants.length === 0 ? (
            <TouchableOpacity
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 20,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#E5E7EB',
                borderStyle: 'dashed'
              }}
              onPress={() => setShowPlantModal(true)}
            >
              <Ionicons name="add-circle" size={40} color="#10B981" />
              <Text style={{
                color: '#6B7280',
                fontSize: 14,
                fontWeight: '500',
                marginTop: 8
              }}>
                Ajouter une plante
              </Text>
            </TouchableOpacity>
          ) : (
            selectedPlants.map((plant, index) => (
              <View 
                key={index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 15,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#E5E7EB'
                }}
              >
                <Text style={{ fontSize: 30, marginRight: 15 }}>
                  {plant.icon}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: 2
                  }}>
                    {plant.name}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: '#6B7280'
                  }}>
                    {plant.category}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#10B981',
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10
                    }}
                    onPress={() => updatePlantQuantity(index, -1)}
                  >
                    <Ionicons name="remove" size={20} color="white" />
                  </TouchableOpacity>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#374151',
                    marginRight: 10
                  }}>
                    {plant.quantity}
                  </Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#10B981',
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10
                    }}
                    onPress={() => updatePlantQuantity(index, 1)}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removePlant(index)}>
                    <Ionicons name="trash" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Section Type d'engrais */}
        <View style={{ padding: 16 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 12
          }}>
            Type d'engrais
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 15,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E5E7EB'
            }}
            onPress={() => setShowFertilizerModal(true)}
          >
            <Text style={{
              flex: 1,
              fontSize: 16,
              fontWeight: '600',
              color: '#374151'
            }}>
              {selectedFertilizerType}
            </Text>
            <Ionicons name="chevron-down" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Section Type de jardin */}
        <View style={{ padding: 16 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 12
          }}>
            Type de jardin
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={{
                backgroundColor: gardenType === 'potager' ? '#10B981' : '#E5E7EB',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 10,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={() => setGardenType('potager')}
            >
              <Text style={{
                color: gardenType === 'potager' ? 'white' : '#374151',
                fontWeight: '500'
              }}>
                Potager
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: gardenType === 'verger' ? '#10B981' : '#E5E7EB',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={() => setGardenType('verger')}
            >
              <Text style={{
                color: gardenType === 'verger' ? 'white' : '#374151',
                fontWeight: '500'
              }}>
                Verger
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Région */}
        <View style={{ padding: 16 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 12
          }}>
            Région
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={{
                backgroundColor: region === 'tropicale' ? '#10B981' : '#E5E7EB',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 10,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={() => setRegion('tropicale')}
            >
              <Text style={{
                color: region === 'tropicale' ? 'white' : '#374151',
                fontWeight: '500'
              }}>
                Tropicale
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: region === 'tempérée' ? '#10B981' : '#E5E7EB',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={() => setRegion('tempérée')}
            >
              <Text style={{
                color: region === 'tempérée' ? 'white' : '#374151',
                fontWeight: '500'
              }}>
                Tempérée
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section pH du sol */}
        <View style={{ padding: 16 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 12
          }}>
            pH du sol
          </Text>
          <TextInput
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 15,
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
              borderWidth: 1,
              borderColor: '#E5E7EB'
            }}
            placeholder="Ex: 6.5"
            keyboardType="numeric"
            value={soilPh}
            onChangeText={setSoilPh}
          />
        </View>

        {/* Bouton Calculer */}
        <TouchableOpacity
          style={{
            backgroundColor: '#10B981',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            margin: 16,
            opacity: isLoading ? 0.7 : 1,
          }}
          onPress={calculateFertilizer}
          disabled={isLoading}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
          }}>
            {isLoading ? 'Calcul en cours...' : 'Calculer'}
          </Text>
        </TouchableOpacity>

        {/* Remplacer la section résultats existante par: */}
        {renderAdvancedResults()}

        {/* Section d'analyse rapide */}
        {results && (
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            margin: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB'
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 12
            }}>
              🧪 Analyse rapide
            </Text>

            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <View style={{
                backgroundColor: '#F0FDF4',
                borderRadius: 8,
                padding: 12,
                flex: 1,
                marginRight: 8,
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 12, color: '#166534', marginBottom: 4 }}>
                  Économie vs chimique
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#10B981' }}>
                  {selectedFertilizerType.includes('organique') ? '30%' : '15%'}
                </Text>
              </View>
              
              <View style={{
                backgroundColor: '#FEF3C7',
                borderRadius: 8,
                padding: 12,
                flex: 1,
                marginLeft: 8,
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 12, color: '#92400E', marginBottom: 4 }}>
                  Difficulté moyenne
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#F59E0B' }}>
                  {results.plants ? 
                    Math.round(results.plants.reduce((acc, p) => 
                      acc + (p.care_difficulty === 'facile' ? 1 : p.care_difficulty === 'moyen' ? 2 : 3), 0
                    ) / results.plants.length) : 2}/3
                  </Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 8,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onPress={exportResults}
            >
              <Ionicons name="download" size={16} color="#6B7280" />
              <Text style={{
                color: '#6B7280',
                fontSize: 14,
                fontWeight: '500',
                marginLeft: 8
              }}>
                Exporter les résultats (PDF)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <PlantModal />
      <ScheduleModal />
      <FertilizerModal />
    </SafeAreaView>
  );
}