import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

export default function FertilizerCalculatorScreen() {
  const navigation = useNavigation();
  
  const [selectedCulture, setSelectedCulture] = useState('Banane');
  const [numberOfPlants, setNumberOfPlants] = useState('7');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const cultures = [
    { id: 1, name: 'Banane', icon: '🍌' },
    { id: 2, name: 'Tomate', icon: '🍅' },
    { id: 3, name: 'Maïs', icon: '🌽' },
    { id: 4, name: 'Riz', icon: '🌾' },
    { id: 5, name: 'Mil', icon: '🌾' },
    { id: 6, name: 'Arachide', icon: '🥜' },
  ];

  const calculateFertilizer = async () => {
    if (!selectedCulture || !numberOfPlants || numberOfPlants === '0') {
      Alert.alert('Erreur', 'Veuillez sélectionner une culture et entrer le nombre de plantes');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post("http://127.0.0.1:8888/calculate-fertilizer/", {
        culture_type: selectedCulture,
        number_of_plants: parseInt(numberOfPlants)
      }, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      setResults(response.data);
    } catch (error) {
      console.error('Erreur calcul:', error);
      Alert.alert('Erreur', 'Erreur lors du calcul des engrais');
    } finally {
      setIsLoading(false);
    }
  };

  const incrementPlants = () => {
    setNumberOfPlants((prev) => (parseInt(prev) + 1).toString());
  };

  const decrementPlants = () => {
    const current = parseInt(numberOfPlants);
    if (current > 1) {
      setNumberOfPlants((current - 1).toString());
    }
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
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
          CALCULATEUR D'ENGRAIS
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Section Type de cultures */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 12,
          }}>
            Type de cultures
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {cultures.map((culture) => (
              <TouchableOpacity
                key={culture.id}
                style={{
                  backgroundColor: selectedCulture === culture.name ? '#10B981' : '#E5E7EB',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => setSelectedCulture(culture.name)}
              >
                <Text style={{ marginRight: 4, fontSize: 16 }}>
                  {culture.icon}
                </Text>
                <Text style={{
                  color: selectedCulture === culture.name ? 'white' : '#374151',
                  fontWeight: '500',
                }}>
                  {culture.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Section Plantes */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 12,
          }}>
            Plantes
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#10B981',
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={decrementPlants}
            >
              <Ionicons name="remove" size={20} color="white" />
            </TouchableOpacity>

            <View style={{
              backgroundColor: '#10B981',
              width: 60,
              height: 60,
              borderRadius: 30,
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 20,
            }}>
              <Text style={{
                color: 'white',
                fontSize: 24,
                fontWeight: 'bold',
              }}>
                {numberOfPlants}
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#10B981',
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={incrementPlants}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bouton Calculer */}
        <TouchableOpacity
          style={{
            backgroundColor: '#10B981',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 24,
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

        {/* Résultats */}
        {results && (
          <View style={{
            backgroundColor: '#10B981',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}>
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
            }}>
              Quantité recommandée
            </Text>
            <Text style={{
              color: 'white',
              fontSize: 14,
              marginBottom: 16,
              opacity: 0.9,
            }}>
              {selectedCulture} - {numberOfPlants} plantes
            </Text>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <Text style={{ color: 'white', fontSize: 14, opacity: 0.9 }}>
                Urée
              </Text>
              <Text style={{ color: 'white', fontSize: 14, opacity: 0.9 }}>
                TSP
              </Text>
              <Text style={{ color: 'white', fontSize: 14, opacity: 0.9 }}>
                MOP
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
              <Text style={{
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
              }}>
                {results.urea} kg
              </Text>
              <Text style={{
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
              }}>
                {results.tsp} kg
              </Text>
              <Text style={{
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
              }}>
                {results.mop} kg
              </Text>
            </View>

            {results.instructions && (
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: 12,
                marginTop: 16,
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 14,
                  lineHeight: 20,
                }}>
                  {results.instructions}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}