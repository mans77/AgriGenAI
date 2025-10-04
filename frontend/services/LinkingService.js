/**
 * Service de gestion des liens deep links
 * Gère la confirmation d'email et autres liens entrants
 */

import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { getBackendURL } from '../config/api';

export class LinkingService {
  static instance = null;

  constructor() {
    if (LinkingService.instance) {
      return LinkingService.instance;
    }
    LinkingService.instance = this;
  }

  /**
   * Configurer les liens entrants
   */
  static configure() {
    const prefix = Linking.createURL('/');
    const backendUrl = getBackendURL(Platform.OS);
    return {
      prefixes: [prefix, 'agrigenai://', `${backendUrl}/`],
      config: {
        screens: {
          Auth: 'auth',
          EmailConfirmation: 'auth/confirm-email',
          PasswordReset: 'auth/reset-password',
          Main: {
            screens: {
              Home: 'home',
              Profile: 'profile',
              Settings: 'settings'
            }
          }
        }
      }
    };
  }

  /**
   * Analyser une URL de confirmation d'email
   */
  static parseConfirmationUrl(url) {
    try {
      console.log('🔍 Analyse URL:', url);
      
      const parsedUrl = new URL(url);
      const token = parsedUrl.searchParams.get('token');
      
      if (parsedUrl.pathname.includes('confirm-email') && token) {
        return {
          type: 'email_confirmation',
          token: token
        };
      }
      
      if (parsedUrl.pathname.includes('reset-password') && token) {
        return {
          type: 'password_reset',
          token: token
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erreur analyse URL:', error);
      return null;
    }
  }

  /**
   * Gérer les liens entrants
   */
  static handleIncomingLink(url, navigation) {
    if (!url || !navigation) return;

    console.log('🔗 Lien entrant:', url);
    
    const parsed = LinkingService.parseConfirmationUrl(url);
    
    if (parsed) {
      console.log('✅ Lien analysé:', parsed);
      
      switch (parsed.type) {
        case 'email_confirmation':
          navigation.navigate('EmailConfirmation', { 
            token: parsed.token 
          });
          break;
          
        case 'password_reset':
          navigation.navigate('PasswordReset', { 
            token: parsed.token 
          });
          break;
          
        default:
          console.log('Type de lien non géré:', parsed.type);
      }
    } else {
      console.log('Lien non reconnu ou invalide');
    }
  }

  /**
   * Écouter les liens entrants
   */
  static setupLinkingListener(navigation) {
    // Gérer les liens quand l'application est fermée
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🚀 Lien initial détecté:', url);
        setTimeout(() => {
          LinkingService.handleIncomingLink(url, navigation);
        }, 1000); // Délai pour s'assurer que la navigation est prête
      }
    });

    // Gérer les liens quand l'application est active
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('📱 Nouveau lien détecté:', event.url);
      LinkingService.handleIncomingLink(event.url, navigation);
    });

    return () => {
      subscription?.remove();
    };
  }

  /**
   * Générer une URL de test pour le développement
   */
  static generateTestConfirmationUrl(token) {
    const baseUrl = getBackendURL(Platform.OS);
    return `${baseUrl}/auth/confirm-email?token=${token}`;
  }

  /**
   * Ouvrir une URL externe
   */
  static async openExternalUrl(url) {
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log('URL non supportée:', url);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erreur ouverture URL:', error);
      return false;
    }
  }
}

export default LinkingService;