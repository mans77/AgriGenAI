import AsyncStorage from '@react-native-async-storage/async-storage';

class UserService {
  constructor() {
    this.userData = null;
    this.userProfile = null;
  }

  /**
   * Sauvegarder les données utilisateur après connexion
   */
  async saveUserData(userData, userProfile = null) {
    try {
      this.userData = userData;
      this.userProfile = userProfile;
      
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      if (userProfile) {
        await AsyncStorage.setItem('user_profile', JSON.stringify(userProfile));
      }
      
      console.log('✅ Données utilisateur sauvegardées:', {
        email: userData.email,
        firstName: userProfile?.first_name || userData.first_name,
        lastName: userProfile?.last_name || userData.last_name
      });
    } catch (error) {
      console.error('❌ Erreur sauvegarde données utilisateur:', error);
    }
  }

  /**
   * Charger les données utilisateur depuis AsyncStorage
   */
  async loadUserData() {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      const userProfile = await AsyncStorage.getItem('user_profile');
      
      if (userData) {
        this.userData = JSON.parse(userData);
      }
      if (userProfile) {
        this.userProfile = JSON.parse(userProfile);
      }
      
      console.log('📱 Données utilisateur chargées:', this.userData);
      return {
        userData: this.userData,
        userProfile: this.userProfile
      };
    } catch (error) {
      console.error('❌ Erreur chargement données utilisateur:', error);
      return { userData: null, userProfile: null };
    }
  }

  /**
   * Obtenir le prénom de l'utilisateur
   */
  getFirstName() {
    if (this.userProfile?.first_name) {
      return this.userProfile.first_name;
    }
    if (this.userData?.first_name) {
      return this.userData.first_name;
    }
    // Fallback: extraire le prénom depuis l'email
    if (this.userData?.email) {
      return this.userData.email.split('@')[0];
    }
    return 'Utilisateur';
  }

  /**
   * Obtenir le nom complet de l'utilisateur
   */
  getFullName() {
    const firstName = this.userProfile?.first_name || this.userData?.first_name || '';
    const lastName = this.userProfile?.last_name || this.userData?.last_name || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    // Fallback
    return this.userData?.email?.split('@')[0] || 'Utilisateur';
  }

  /**
   * Obtenir l'email de l'utilisateur
   */
  getEmail() {
    return this.userData?.email || 'email@example.com';
  }

  /**
   * Obtenir toutes les informations utilisateur formatées
   */
  getUserInfo() {
    return {
      firstName: this.getFirstName(),
      lastName: this.userProfile?.last_name || this.userData?.last_name || '',
      fullName: this.getFullName(),
      email: this.getEmail(),
      rawUserData: this.userData,
      rawUserProfile: this.userProfile
    };
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  async isLoggedIn() {
    try {
      const token = await AsyncStorage.getItem('access_token');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  /**
   * Déconnexion - nettoyer toutes les données
   */
  async logout() {
    try {
      await AsyncStorage.multiRemove(['access_token', 'user_data', 'user_profile']);
      this.userData = null;
      this.userProfile = null;
      console.log('✅ Utilisateur déconnecté');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
  }

  /**
   * Mettre à jour les informations de profil
   */
  async updateProfile(profileData) {
    try {
      this.userProfile = { ...this.userProfile, ...profileData };
      await AsyncStorage.setItem('user_profile', JSON.stringify(this.userProfile));
      console.log('✅ Profil mis à jour:', profileData);
      return true;
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      return false;
    }
  }
}

// Instance singleton
export const userService = new UserService();
export default UserService;