import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Image,
  Alert,
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { userService } from '../services/UserService';

const Profile = () => {
  const navigation = useNavigation();
  
  // États du profil utilisateur
  const [userProfile, setUserProfile] = useState({
    firstName: 'Utilisateur',
    lastName: '', 
    email: 'email@example.com',
    phone: '',
    location: '',
    farmSize: '0',
    farmType: 'Agriculture',
    experience: '0',
    profileImage: 'https://via.placeholder.com/120x120/10B981/ffffff?text=U',
    bio: '',
    joinDate: new Date().toISOString().split('T')[0],
    completedDiagnoses: 0,
    sharedAlerts: 0,
    helpfulRatings: 0
  });

  // États des modals et formulaires
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editingField, setEditingField] = useState('');
  const [tempValue, setTempValue] = useState('');
  
  // États des préférences
  const [notifications, setNotifications] = useState({
    weather: true,
    alerts: true,
    community: false,
    marketing: false
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Types de culture disponibles
  const farmTypes = [
    'Cultures vivrières', 'Maraîchage', 'Arboriculture', 
    'Céréales', 'Légumineuses', 'Cultures industrielles'
  ];

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // Charger les données utilisateur depuis le service
      await userService.loadUserData();
      const userInfo = userService.getUserInfo();
      
      console.log('👤 Données utilisateur Profile:', userInfo);
      
      // Générer l'image de profil avec les initiales
      const initials = `${userInfo.firstName.charAt(0)}${userInfo.lastName.charAt(0)}`.toUpperCase();
      const profileImage = `https://via.placeholder.com/120x120/10B981/ffffff?text=${initials}`;
      
      // Mettre à jour le profil avec les vraies données
      setUserProfile(prevProfile => ({
        ...prevProfile,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userInfo.email,
        profileImage: profileImage,
        // Garder les autres valeurs du profil existant ou valeurs par défaut
        phone: prevProfile.phone || '',
        location: prevProfile.location || '',
        farmSize: prevProfile.farmSize || '0',
        farmType: prevProfile.farmType || 'Agriculture',
        experience: prevProfile.experience || '0',
        bio: prevProfile.bio || '',
        joinDate: prevProfile.joinDate,
        completedDiagnoses: prevProfile.completedDiagnoses || 0,
        sharedAlerts: prevProfile.sharedAlerts || 0,
        helpfulRatings: prevProfile.helpfulRatings || 0
      }));
      
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Changement de photo de profil
  const changeProfileImage = async () => {
    Alert.alert(
      'Photo de profil',
      'Choisir une source',
      [
        { text: 'Galerie', onPress: pickImageFromGallery },
        { text: 'Appareil photo', onPress: takePhoto },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à vos photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUserProfile(prev => ({
          ...prev,
          profileImage: result.assets[0].uri
        }));
        Alert.alert('Succès', 'Photo de profil mise à jour !');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sélection de l\'image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à votre caméra.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUserProfile(prev => ({
          ...prev,
          profileImage: result.assets[0].uri
        }));
        Alert.alert('Succès', 'Photo de profil mise à jour !');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la prise de photo');
    }
  };

  // Obtenir la localisation actuelle
  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à votre localisation.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address.length > 0) {
        const currentLocation = `${address[0].city || address[0].district}, ${address[0].country}`;
        setUserProfile(prev => ({
          ...prev,
          location: currentLocation
        }));
        Alert.alert('Succès', 'Localisation mise à jour !');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'obtenir votre localisation');
    } finally {
      setIsLoading(false);
    }
  };

  // Édition des champs
  const startEditing = (field, currentValue) => {
    setEditingField(field);
    setTempValue(currentValue);
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!tempValue.trim()) {
      Alert.alert('Erreur', 'Le champ ne peut pas être vide');
      return;
    }

    try {
      // Mettre à jour localement
      setUserProfile(prev => ({
        ...prev,
        [editingField]: tempValue
      }));
      
      // Si c'est un champ utilisateur de base, mettre à jour dans le service
      if (['firstName', 'lastName', 'email'].includes(editingField)) {
        const updatedData = {
          [editingField]: tempValue
        };
        await userService.updateProfile(updatedData);
        console.log('✅ Profil utilisateur synchronisé:', updatedData);
      }
      
      setShowEditModal(false);
      setEditingField('');
      setTempValue('');
      Alert.alert('Succès', 'Profil mis à jour !');
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    }
  };

  // Déconnexion
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnecter', 
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              console.error('❌ Erreur déconnexion:', error);
            }
          }
        }
      ]
    );
  };

  // Supprimer le compte
  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Fonctionnalité de suppression à implémenter côté serveur');
          }
        }
      ]
    );
  };

  const formatJoinDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderStatCard = (title, value, icon, color) => (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Ionicons name={icon} size={20} color="white" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 14,
          color: '#6B7280',
          marginBottom: 2,
        }}>
          {title}
        </Text>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#374151',
        }}>
          {value}
        </Text>
      </View>
    </View>
  );

  const renderProfileItem = (icon, title, value, onPress, editable = true) => (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      onPress={onPress}
      disabled={!editable}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0F2FE',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Ionicons name={icon} size={20} color="#0369A1" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 14,
          color: '#6B7280',
          marginBottom: 2,
        }}>
          {title}
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#374151',
          fontWeight: '500',
        }}>
          {value}
        </Text>
      </View>
      {editable && (
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      )}
    </TouchableOpacity>
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
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ padding: 4 }}
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
          PROFIL
        </Text>
        <TouchableOpacity 
          onPress={() => setShowStatsModal(true)}
          style={{ padding: 4 }}
        >
          <Ionicons name="analytics" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Section Profil Principal */}
        <View style={{
          backgroundColor: '#10B981',
          paddingHorizontal: 16,
          paddingVertical: 24,
          alignItems: 'center',
        }}>
          {/* Photo de profil */}
          <TouchableOpacity 
            onPress={changeProfileImage}
            style={{ position: 'relative', marginBottom: 16 }}
          >
            <Image
              source={{ uri: userProfile.profileImage }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 4,
                borderColor: 'white',
              }}
            />
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: 'white',
              borderRadius: 18,
              padding: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}>
              <Ionicons name="camera" size={20} color="#10B981" />
            </View>
          </TouchableOpacity>

          {/* Nom et informations de base */}
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 4,
          }}>
            {userProfile.firstName} {userProfile.lastName}
          </Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <Ionicons name="location" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              marginLeft: 4,
            }}>
              {userProfile.location}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Ionicons name="calendar" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              marginLeft: 4,
            }}>
              Membre depuis le {formatJoinDate(userProfile.joinDate)}
            </Text>
          </View>
        </View>

        {/* Statistiques rapides */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 16,
          justifyContent: 'space-around',
          backgroundColor: 'white',
          marginHorizontal: 16,
          marginTop: -20,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#10B981',
            }}>
              {userProfile.completedDiagnoses}
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#6B7280',
              textAlign: 'center',
            }}>
              Diagnostics
            </Text>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#F59E0B',
            }}>
              {userProfile.sharedAlerts}
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#6B7280',
              textAlign: 'center',
            }}>
              Alertes partagées
            </Text>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#EF4444',
            }}>
              {userProfile.helpfulRatings}%
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#6B7280',
              textAlign: 'center',
            }}>
              Avis utiles
            </Text>
          </View>
        </View>

        {/* Informations personnelles */}
        <View style={{ padding: 16 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 16,
          }}>
            Informations personnelles
          </Text>

          {renderProfileItem(
            'person-outline', 
            'Prénom', 
            userProfile.firstName,
            () => startEditing('firstName', userProfile.firstName)
          )}

          {renderProfileItem(
            'person-outline', 
            'Nom de famille', 
            userProfile.lastName,
            () => startEditing('lastName', userProfile.lastName)
          )}

          {renderProfileItem(
            'mail-outline', 
            'Email', 
            userProfile.email,
            () => startEditing('email', userProfile.email)
          )}

          {renderProfileItem(
            'call-outline', 
            'Téléphone', 
            userProfile.phone,
            () => startEditing('phone', userProfile.phone)
          )}

          {renderProfileItem(
            'location-outline', 
            'Localisation', 
            userProfile.location,
            getCurrentLocation
          )}

          {renderProfileItem(
            'document-text-outline', 
            'Bio', 
            userProfile.bio || 'Ajouter une description...',
            () => startEditing('bio', userProfile.bio)
          )}
        </View>

        {/* Informations agricoles */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 16,
          }}>
            Activité agricole
          </Text>

          {renderProfileItem(
            'resize-outline', 
            'Superficie (hectares)', 
            userProfile.farmSize + ' ha',
            () => startEditing('farmSize', userProfile.farmSize)
          )}

          {renderProfileItem(
            'leaf-outline', 
            'Type de culture', 
            userProfile.farmType,
            () => startEditing('farmType', userProfile.farmType)
          )}

          {renderProfileItem(
            'time-outline', 
            'Expérience (années)', 
            userProfile.experience + ' ans',
            () => startEditing('experience', userProfile.experience)
          )}
        </View>

        {/* Préférences */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 16,
          }}>
            Notifications
          </Text>

          {Object.entries({
            weather: 'Alertes météo',
            alerts: 'Alertes communauté', 
            community: 'Messages communauté',
            marketing: 'Promotions et actualités'
          }).map(([key, title]) => (
            <View key={key} style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}>
              <Text style={{
                fontSize: 16,
                color: '#374151',
                flex: 1,
              }}>
                {title}
              </Text>
              <Switch
                value={notifications[key]}
                onValueChange={(value) => setNotifications(prev => ({
                  ...prev,
                  [key]: value
                }))}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor="#ffffff"
              />
            </View>
          ))}
        </View>

        {/* Actions du compte */}
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 16,
          }}>
            Compte
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={() => Alert.alert('Info', 'Fonctionnalité de support à implémenter')}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#E0F2FE',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="help-circle-outline" size={20} color="#0369A1" />
            </View>
            <Text style={{
              flex: 1,
              fontSize: 16,
              color: '#374151',
            }}>
              Centre d'aide
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={handleLogout}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FEF3C7',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="log-out-outline" size={20} color="#92400E" />
            </View>
            <Text style={{
              flex: 1,
              fontSize: 16,
              color: '#92400E',
              fontWeight: '500',
            }}>
              Se déconnecter
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
            onPress={handleDeleteAccount}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </View>
            <Text style={{
              flex: 1,
              fontSize: 16,
              color: '#DC2626',
              fontWeight: '500',
            }}>
              Supprimer le compte
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal d'édition */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={{
              backgroundColor: 'white',
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
            }}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#10B981" />
              </TouchableOpacity>
              <Text style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 18,
                fontWeight: '600',
                color: '#10B981',
              }}>
                Modifier {editingField}
              </Text>
              <TouchableOpacity onPress={saveEdit}>
                <Ionicons name="checkmark" size={24} color="#10B981" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, padding: 16 }}>
              {editingField === 'farmType' ? (
                <ScrollView>
                  {farmTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={{
                        backgroundColor: tempValue === type ? '#10B981' : 'white',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: tempValue === type ? '#10B981' : '#E5E7EB',
                      }}
                      onPress={() => setTempValue(type)}
                    >
                      <Text style={{
                        color: tempValue === type ? 'white' : '#374151',
                        fontSize: 16,
                        fontWeight: '500',
                      }}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <TextInput
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    minHeight: editingField === 'bio' ? 120 : 50,
                    textAlignVertical: editingField === 'bio' ? 'top' : 'center',
                  }}
                  value={tempValue}
                  onChangeText={setTempValue}
                  placeholder={`Entrez votre ${editingField}`}
                  multiline={editingField === 'bio'}
                  numberOfLines={editingField === 'bio' ? 4 : 1}
                  keyboardType={
                    editingField === 'email' ? 'email-address' :
                    editingField === 'phone' ? 'phone-pad' :
                    ['farmSize', 'experience'].includes(editingField) ? 'numeric' : 'default'
                  }
                  autoFocus
                />
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Modal des statistiques détaillées */}
      <Modal
        visible={showStatsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          <View style={{
            backgroundColor: 'white',
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}>
            <TouchableOpacity onPress={() => setShowStatsModal(false)}>
              <Ionicons name="close" size={24} color="#10B981" />
            </TouchableOpacity>
            <Text style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '600',
              color: '#10B981',
            }}>
              Mes statistiques
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }}>
            {renderStatCard('Diagnostics réalisés', userProfile.completedDiagnoses, 'camera', '#10B981')}
            {renderStatCard('Alertes partagées', userProfile.sharedAlerts, 'warning', '#F59E0B')}
            {renderStatCard('Taux d\'utilité', userProfile.helpfulRatings + '%', 'thumbs-up', '#EF4444')}
            {renderStatCard('Jours d\'activité', '127', 'calendar', '#8B5CF6')}
            {renderStatCard('Messages envoyés', '34', 'chatbubble-ellipses', '#06B6D4')}
            {renderStatCard('Conseils reçus', '89', 'bulb', '#F97316')}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export default Profile;
