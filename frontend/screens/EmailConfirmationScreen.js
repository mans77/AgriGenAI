import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { NETWORK_CONFIG, API_ENDPOINTS } from '../config/network';

const API_BASE_URL = NETWORK_CONFIG.API_BASE_URL;

export default function EmailConfirmationScreen({ navigation, route }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState('pending'); // pending, success, error
  const [message, setMessage] = useState('');
  
  // Récupérer le token depuis les paramètres de route ou l'URL
  const { token, email } = route.params || {};

  useEffect(() => {
    if (token) {
      confirmEmail(token);
    }
  }, [token]);

  const confirmEmail = async (confirmationToken) => {
    setIsConfirming(true);
    try {
      console.log('🔍 Confirmation avec token:', confirmationToken);
      
      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.CONFIRM_EMAIL}?token=${confirmationToken}`,
        {
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.data) {
        setConfirmationStatus('success');
        setMessage('Votre email a été confirmé avec succès ! Vous pouvez maintenant vous connecter.');
        
        // Rediriger automatiquement vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigation.navigate('Auth');
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur confirmation email:', error);
      setConfirmationStatus('error');
      
      if (error.response?.status === 400) {
        setMessage('Le lien de confirmation est invalide ou a expiré. Veuillez demander un nouveau lien.');
      } else if (error.code === 'ERR_NETWORK') {
        setMessage('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else {
        setMessage('Une erreur est survenue lors de la confirmation. Veuillez réessayer.');
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleResendConfirmation = () => {
    Alert.alert(
      'Renvoyer l\'email de confirmation',
      'Cette fonctionnalité sera bientôt disponible. En attendant, vous pouvez créer un nouveau compte.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Créer un nouveau compte', 
          onPress: () => navigation.navigate('Auth') 
        }
      ]
    );
  };

  const renderContent = () => {
    if (isConfirming) {
      return (
        <View style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color="white" />
          <Text style={{
            color: 'white',
            fontSize: 18,
            marginTop: 20,
            textAlign: 'center'
          }}>
            Confirmation de votre email en cours...
          </Text>
        </View>
      );
    }

    if (confirmationStatus === 'success') {
      return (
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <Ionicons name="checkmark-circle" size={50} color="#22C55E" />
          </View>
          
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            Email confirmé !
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 32
          }}>
            {message}
          </Text>
          
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 8,
              paddingVertical: 16,
              paddingHorizontal: 32,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)'
            }}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
            }}>
              Se connecter maintenant
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (confirmationStatus === 'error') {
      return (
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <Ionicons name="close-circle" size={50} color="#EF4444" />
          </View>
          
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            Confirmation échouée
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 32
          }}>
            {message}
          </Text>
          
          <View style={{ flexDirection: 'column', gap: 16, width: '100%' }}>
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderRadius: 8,
                paddingVertical: 16,
                alignItems: 'center'
              }}
              onPress={handleResendConfirmation}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
              }}>
                Renvoyer l'email de confirmation
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                paddingVertical: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)'
              }}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
              }}>
                Retour à la connexion
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // État initial - pas de token fourni
    return (
      <View style={{ alignItems: 'center' }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <Ionicons name="mail" size={40} color="#3B82F6" />
        </View>
        
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: 'white',
          marginBottom: 16,
          textAlign: 'center'
        }}>
          Vérifiez votre email
        </Text>
        
        <Text style={{
          fontSize: 16,
          color: 'rgba(255, 255, 255, 0.9)',
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 32
        }}>
          Nous avons envoyé un lien de confirmation à votre adresse email.
          {email && ` \n\n📧 ${email}`}
          {'\n\n'}Cliquez sur le lien dans l'email pour activer votre compte.
        </Text>
        
        <TouchableOpacity
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 8,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)'
          }}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
          }}>
            Retour à la connexion
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#10B981', '#059669']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          padding: 24,
          paddingTop: 80
        }}>
          {/* Logo */}
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
            }}>
              AgriGenAI
            </Text>
          </View>

          {/* Contenu principal */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            padding: 32,
            backdropFilter: 'blur(10px)',
          }}>
            {renderContent()}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}