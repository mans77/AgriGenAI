import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fastRTCService } from '../services/FastRTCService.native';
import { getBackendURL, getCommonHeaders } from '../config/api';
import { userService } from '../services/UserService';

const API_BASE_URL = getBackendURL(Platform.OS);

// Test de connectivité au démarrage
const testConnectivity = async () => {
  try {
    console.log("🔍 Test de connectivité API...");
    const response = await axios.get(`${API_BASE_URL}/health`, { 
      timeout: 5000 
    });
    console.log("✅ API accessible:", response.data);
    return true;
  } catch (error) {
    console.error("❌ API non accessible:", error.message);
    return false;
  }
};

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('sorogueye93@gmail.com'); // Votre compte
  const [password, setPassword] = useState('M7@ns5our');           // Votre mot de passe
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation des champs
  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return false;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return false;
    }

    if (!isLogin) {
      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer votre nom et prénom');
        return false;
      }

      if (password !== confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return false;
      }

      if (password.length < 6) {
        Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
        return false;
      }
    }

    return true;
  };

  // Fonction de connexion avec retry optimisé
  const handleLogin = async () => {
    try {
      // Test de connectivité d'abord
      const isConnected = await fastRTCService.testConnection();
      if (!isConnected) {
        Alert.alert(
          'Connexion impossible', 
          'Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.'
        );
        return;
      }

      const loginData = {
        email: email.trim(),
        password: password,
      };
      
      console.log('🔐 Données de connexion:', loginData);
      console.log('🌐 URL API:', `${API_BASE_URL}/auth/login`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData, {
        timeout: 10000,
        headers: getCommonHeaders()
      });
      
      console.log('✅ Réponse reçue:', response.data);

      if (response.data && response.data.access_token) {
        // Sauvegarder le token
        await AsyncStorage.setItem('access_token', response.data.access_token);
        
        // Utiliser le UserService pour gérer les données utilisateur
        await userService.saveUserData(response.data.user, response.data.profile);
        
        const userInfo = userService.getUserInfo();
        console.log('👤 Informations utilisateur:', userInfo);

        Alert.alert(
          'Connexion réussie',
          `Bienvenue ${userInfo.firstName} !`,
          [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
        );
      }
    } catch (error) {
      console.error('❌ Erreur de connexion complète:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Data:', error.response?.data);
      console.error('❌ Headers:', error.response?.headers);
      console.error('❌ Config:', error.config);
      
      let errorMessage = 'Erreur de connexion';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data.detail || 'Email ou mot de passe incorrect';
        console.log('📋 Détail erreur 400:', error.response.data);
      } else if (error.response?.status === 422) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Serveur non accessible. L\'API est-elle démarrée ?';
      }
      
      Alert.alert('Erreur de Connexion', `${errorMessage}\n\nStatus: ${error.response?.status || 'N/A'}`);
    }
  };

  // Fonction d'inscription avec connectivité optimisée
  const handleRegister = async () => {
    try {
      // Test de connectivité d'abord
      const isConnected = await fastRTCService.testConnection();
      if (!isConnected) {
        Alert.alert(
          'Connexion impossible', 
          'Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.'
        );
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: email.trim(),
        password: password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        provider: 'local'
      }, {
        timeout: 10000,
        headers: getCommonHeaders()
      });

      if (response.data) {
        // Naviguer directement vers la page de confirmation
        navigation.navigate('EmailConfirmation', { 
          email: email.trim(),
          message: 'Un email de confirmation a été envoyé à votre adresse.'
        });
        
        // Nettoyer les champs pour la prochaine utilisation
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data.detail || 'Un compte avec cet email existe déjà';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
      }
      
      Alert.alert('Erreur', errorMessage);
    }
  };

  // Fonction principale d'authentification
  const handleAuth = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de réinitialisation de mot de passe
  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert(
        'Email requis',
        'Veuillez entrer votre adresse email puis cliquer sur "Mot de passe oublié".'
      );
      return;
    }

    Alert.alert(
      'Réinitialisation du mot de passe',
      `Envoyer un lien de réinitialisation à ${email} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            try {
              setIsLoading(true);
              await axios.post(`${API_BASE_URL}/auth/request-password-reset`, {
                email: email.trim()
              }, {
                headers: getCommonHeaders()
              });

              Alert.alert(
                'Email envoyé',
                'Si cet email existe dans notre base, un lien de réinitialisation a été envoyé.'
              );
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'envoyer l\'email de réinitialisation');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSocialAuth = (provider) => {
    Alert.alert('Info', `Connexion avec ${provider} en cours de développement`);
  };

  // Fonction de diagnostic de connexion
  const runDiagnostic = async () => {
    Alert.alert(
      'Diagnostic de connexion',
      'Test en cours...',
      [{ text: 'OK' }]
    );

    try {
      const results = await fastRTCService.diagnoseConnection();
      const { summary } = results;
      
      Alert.alert(
        'Résultat du diagnostic',
        `Tests réussis: ${summary.successful}/${summary.total_tests}\n` +
        `Taux de succès: ${summary.success_rate}%\n\n` +
        `${summary.success_rate > 50 ? '✅ Connexion OK' : '❌ Problème de connexion'}`,
        [
          { text: 'Détails', onPress: () => console.log('Diagnostic complet:', results) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Erreur de diagnostic',
        `Impossible d'effectuer le test: ${error.message}`
      );
    }
  };

  return (
    <LinearGradient
      colors={['#10B981', '#059669']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', padding: 24 }}
        >
          {/* Logo et titre */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="leaf" size={40} color="white" />
            </View>
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: 'white',
              marginBottom: 8,
            }}>
              AgriGenAI
            </Text>
            <Text style={{
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
            }}>
              {isLogin ? 'Connectez-vous à votre compte' : 'Créer votre compte'}
            </Text>
          </View>

          {/* Formulaire */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}>
            
            {/* Switch Connexion/Inscription */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: '#F3F4F6',
              borderRadius: 25,
              padding: 4,
              marginBottom: 24,
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 20,
                  backgroundColor: isLogin ? '#10B981' : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => {
                  setIsLogin(true);
                  setPassword('');
                  setConfirmPassword('');
                  setFirstName('');
                  setLastName('');
                }}
              >
                <Text style={{
                  color: isLogin ? 'white' : '#6B7280',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  Connexion
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 20,
                  backgroundColor: !isLogin ? '#10B981' : 'transparent',
                  alignItems: 'center',
                }}
                onPress={() => {
                  setIsLogin(false);
                  setPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={{
                  color: !isLogin ? 'white' : '#6B7280',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  S'inscrire
                </Text>
              </TouchableOpacity>
            </View>
            {/* Champs Nom et Prénom pour l'inscription */}
            {!isLogin && (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                    Prénom
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      fontSize: 16,
                    }}
                    placeholder="Votre prénom"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                    Nom
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      fontSize: 16,
                    }}
                    placeholder="Votre nom"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                paddingHorizontal: 12,
              }}>
                <Ionicons name="mail" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 16,
                  }}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Mot de passe */}
            <View style={{ marginBottom: !isLogin ? 16 : 24 }}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                paddingHorizontal: 12,
              }}>
                <Ionicons name="lock-closed" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 16,
                  }}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmation mot de passe pour l'inscription */}
            {!isLogin && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                }}>
                  <Ionicons name="lock-closed" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      fontSize: 16,
                    }}
                    placeholder="Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Bouton principal */}
            <TouchableOpacity
              style={{
                backgroundColor: '#10B981',
                borderRadius: 8,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: 16,
                opacity: isLoading ? 0.7 : 1,
              }}
              onPress={handleAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  {isLogin ? 'Se connecter' : 'S\'inscrire'}
                </Text>
              )}
            </TouchableOpacity>


            {/* Authentification sociale */}
            <View style={{ marginTop: 24 }}>
              <Text style={{
                textAlign: 'center',
                color: '#9CA3AF',
                fontSize: 14,
                marginBottom: 16,
              }}>
                Ou continuer avec
              </Text>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 16,
              }}>
                <TouchableOpacity
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#1877F2',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleSocialAuth('Facebook')}
                >
                  <Ionicons name="logo-facebook" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#4285F4',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleSocialAuth('Google')}
                >
                  <Ionicons name="logo-google" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Lien mot de passe oublié */}
          {isLogin && (
            <TouchableOpacity
              style={{ alignItems: 'center', marginTop: 20 }}
              onPress={handleForgotPassword}
            >
              <Text style={{
                color: 'white',
                fontSize: 14,
                textDecorationLine: 'underline',
              }}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          )}

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}