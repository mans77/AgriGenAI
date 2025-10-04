import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function AlertsScreen() {
  const navigation = useNavigation();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Données d'exemple pour les alertes
    setAlerts([
      {
        id: 1,
        type: 'weather',
        title: 'Alerte Météo',
        message: 'Risque de pluie dans les 24h. Protégez vos cultures sensibles.',
        severity: 'warning',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
        icon: 'rainy-outline'
      },
      {
        id: 2,
        type: 'pest',
        title: 'Détection de Ravageurs',
        message: 'Présence de pucerons détectée sur vos plants de tomates.',
        severity: 'danger',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6h ago
        icon: 'bug-outline'
      },
      {
        id: 3,
        type: 'irrigation',
        title: 'Irrigation Recommandée',
        message: 'Vos cultures nécessitent un arrosage dans les prochaines heures.',
        severity: 'info',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12h ago
        icon: 'water-outline'
      },
      {
        id: 4,
        type: 'fertilizer',
        title: 'Fertilisation Due',
        message: 'Il est temps d\'appliquer l\'engrais NPK sur vos céréales.',
        severity: 'warning',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        icon: 'nutrition-outline'
      }
    ]);
  }, []);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'danger':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'danger':
        return 'URGENT';
      case 'warning':
        return 'ATTENTION';
      case 'info':
        return 'INFO';
      default:
        return 'NORMAL';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      return 'À l\'instant';
    }
  };

  const handleAlertPress = (alert) => {
    Alert.alert(
      alert.title,
      alert.message,
      [
        { text: 'Fermer', style: 'cancel' },
        { text: 'Marquer comme lu', onPress: () => markAsRead(alert.id) }
      ]
    );
  };

  const markAsRead = (alertId) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    Alert.alert(
      'Effacer toutes les alertes',
      'Êtes-vous sûr de vouloir effacer toutes les alertes ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Effacer', style: 'destructive', onPress: () => setAlerts([]) }
      ]
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
          ALERTES
        </Text>
        {alerts.length > 0 && (
          <TouchableOpacity 
            onPress={clearAllAlerts}
            style={{ padding: 4 }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Statistics */}
        <View style={{
          backgroundColor: '#10B981',
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
        }}>
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 8,
          }}>
            🔔 CENTRE D'ALERTES AGRICOLES
          </Text>
          <Text style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 14,
            lineHeight: 20,
          }}>
            Surveillez votre exploitation avec des alertes intelligentes basées sur l'IA et les données météorologiques.
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.2)',
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                color: 'white',
                fontSize: 20,
                fontWeight: '700',
              }}>
                {alerts.length}
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 12,
              }}>
                Alertes actives
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                color: 'white',
                fontSize: 20,
                fontWeight: '700',
              }}>
                {alerts.filter(a => a.severity === 'danger').length}
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 12,
              }}>
                Urgentes
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                color: 'white',
                fontSize: 20,
                fontWeight: '700',
              }}>
                24h
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 12,
              }}>
                Surveillance
              </Text>
            </View>
          </View>
        </View>

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#10B981',
              marginTop: 16,
              marginBottom: 8,
              textAlign: 'center',
            }}>
              Aucune alerte active
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              textAlign: 'center',
              lineHeight: 20,
            }}>
              Votre exploitation est surveillée en continu.{'\n'}
              Vous serez notifié en cas d'événement important.
            </Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderLeftWidth: 4,
                borderLeftColor: getSeverityColor(alert.severity),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
              onPress={() => handleAlertPress(alert)}
              activeOpacity={0.7}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}>
                <View style={{ flex: 1 }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <Ionicons 
                      name={alert.icon} 
                      size={20} 
                      color={getSeverityColor(alert.severity)}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#374151',
                      flex: 1,
                    }}>
                      {alert.title}
                    </Text>
                    <View style={{
                      backgroundColor: getSeverityColor(alert.severity),
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}>
                      <Text style={{
                        color: 'white',
                        fontSize: 10,
                        fontWeight: '600',
                      }}>
                        {getSeverityLabel(alert.severity)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={{
                    fontSize: 13,
                    color: '#6B7280',
                    lineHeight: 18,
                    marginBottom: 8,
                  }}>
                    {alert.message}
                  </Text>
                  
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <Text style={{
                      fontSize: 12,
                      color: '#9CA3AF',
                    }}>
                      {formatTimeAgo(alert.timestamp)}
                    </Text>
                    
                    <TouchableOpacity
                      onPress={() => markAsRead(alert.id)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{
                        fontSize: 12,
                        color: '#10B981',
                        fontWeight: '500',
                      }}>
                        Marquer comme lu
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Alert Types Info */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 12,
          padding: 16,
          marginTop: 8,
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 12,
          }}>
            📱 TYPES D'ALERTES DISPONIBLES
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <View style={{
              backgroundColor: '#F3F4F6',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="rainy-outline" size={16} color="#3B82F6" />
              <Text style={{ fontSize: 12, color: '#374151', marginLeft: 4 }}>
                Météo
              </Text>
            </View>
            
            <View style={{
              backgroundColor: '#F3F4F6',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="bug-outline" size={16} color="#EF4444" />
              <Text style={{ fontSize: 12, color: '#374151', marginLeft: 4 }}>
                Ravageurs
              </Text>
            </View>
            
            <View style={{
              backgroundColor: '#F3F4F6',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="water-outline" size={16} color="#10B981" />
              <Text style={{ fontSize: 12, color: '#374151', marginLeft: 4 }}>
                Irrigation
              </Text>
            </View>
            
            <View style={{
              backgroundColor: '#F3F4F6',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="nutrition-outline" size={16} color="#F59E0B" />
              <Text style={{ fontSize: 12, color: '#374151', marginLeft: 4 }}>
                Fertilisation
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}