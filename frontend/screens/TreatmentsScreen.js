import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function TreatmentsScreen() {
  const navigation = useNavigation();

  const handleGoBack = () => {
    // Retour vers l'accueil principal
    navigation.navigate('Home');
  };

  const treatmentOptions = [
    {
      id: 1,
      title: 'Calculateurs d\'engrais',
      icon: 'calculator-outline',
      screen: 'FertilizerCalculator',
      description: 'Calculez les doses d\'engrais optimales'
    },
    {
      id: 2,
      title: 'Ravageurs et maladies',
      icon: 'bug-outline',
      screen: 'PestsAndDiseases',
      description: 'Identifiez et traitez les problèmes'
    },
    {
      id: 3,
      title: 'Conseils et Cultures',
      icon: 'chatbubbles-outline',
      screen: 'AdviceAndCultures',
      description: 'Guides et recommandations'
    },
    {
      id: 4,
      title: 'Alertes',
      icon: 'warning-outline',
      screen: 'Alerts',
      description: 'Notifications importantes'
    },
    {
      id: 5,
      title: 'Types de sols et recommandations',
      icon: 'layers-outline',
      screen: 'SoilTypes',
      description: 'Analysez votre sol',
      isLarge: true
    }
  ];

  const handleNavigation = (screen) => {
    navigation.navigate(screen);
  };

  const renderTreatmentCard = (item) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={{
          backgroundColor: '#10B981',
          borderRadius: 16,
          padding: 16,
          margin: 8,
          width: item.isLarge ? '95%' : '45%',
          minHeight: item.isLarge ? 80 : 120,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onPress={() => handleNavigation(item.screen)}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            width: 48,
            height: 48,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}>
            <Ionicons name={item.icon} size={24} color="white" />
          </View>
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            lineHeight: 20,
          }}>
            {item.title}
          </Text>
          {!item.isLarge && (
            <Text style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 12,
              marginTop: 4,
            }}>
              {item.description}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="white" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header avec bouton retour fonctionnel */}
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
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
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
          TRAITEMENTS
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Grid Layout amélioré */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {/* Première rangée - 2x2 Grid */}
          {treatmentOptions.slice(0, 4).map((item, index) => {
            if (index % 2 === 0) {
              return (
                <View key={`row-${index}`} style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                  {renderTreatmentCard(treatmentOptions[index])}
                  {treatmentOptions[index + 1] && renderTreatmentCard(treatmentOptions[index + 1])}
                </View>
              );
            }
            return null;
          })}

          {/* Grande carte - Largeur complète */}
          <View style={{ width: '100%', alignItems: 'center' }}>
            {renderTreatmentCard(treatmentOptions[4])}
          </View>
        </View>

        {/* Information supplémentaire */}
        <View style={{
          marginTop: 24,
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: '#10B981',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="information-circle" size={20} color="#10B981" />
            <Text style={{
              color: '#10B981',
              fontWeight: '600',
              marginLeft: 8,
              fontSize: 16,
            }}>
              Outils agricoles
            </Text>
          </View>
          <Text style={{
            color: '#6B7280',
            fontSize: 14,
            lineHeight: 20,
          }}>
            Accédez à tous nos outils d'aide à la décision pour optimiser vos traitements agricoles et améliorer vos rendements.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}