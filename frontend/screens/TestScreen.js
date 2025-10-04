/**
 * Écran de test pour débugger la connectivité
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { fastRTCService } from '../services/FastRTCService.native';

const TestScreen = ({ navigation }) => {
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    console.log(`[TestScreen] ${message}`);
  };

  useEffect(() => {
    addLog('Écran de test initialisé');
  }, []);

  const testConnectivity = async () => {
    setStatus('Test de connectivité...');
    addLog('🔍 Début test connectivité');
    
    try {
      const result = await fastRTCService.testConnection();
      if (result) {
        addLog('✅ Connexion réussie');
        setStatus('✅ Connecté');
      } else {
        addLog('❌ Connexion échouée');
        setStatus('❌ Déconnecté');
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error.message}`);
      setStatus('❌ Erreur');
    }
  };

  const testDiagnostic = async () => {
    setStatus('Diagnostic...');
    addLog('🔍 Début diagnostic complet');
    
    try {
      const results = await fastRTCService.diagnoseConnection();
      addLog(`📊 Tests: ${results.summary.successful}/${results.summary.total_tests}`);
      addLog(`📈 Taux de succès: ${results.summary.success_rate}%`);
      
      Alert.alert(
        'Diagnostic terminé',
        `Tests réussis: ${results.summary.successful}/${results.summary.total_tests}\n` +
        `Taux de succès: ${results.summary.success_rate}%`,
        [
          { text: 'Détails', onPress: () => console.log('Diagnostic:', results) },
          { text: 'OK' }
        ]
      );
      
      setStatus(`📊 ${results.summary.success_rate}% réussi`);
    } catch (error) {
      addLog(`❌ Erreur diagnostic: ${error.message}`);
      setStatus('❌ Diagnostic échoué');
    }
  };

  const testLogin = async () => {
    setStatus('Test login...');
    addLog('🔐 Test authentification');
    
    try {
      const axios = require('axios');
      const response = await axios.post('http://192.168.1.100:8000/auth/login', {
        email: 'admin@agrigen.ai',
        password: 'admin123'
      });
      
      addLog('✅ Login réussi');
      addLog(`Token: ${response.data.access_token.substring(0, 20)}...`);
      setStatus('✅ Authentifié');
      
      Alert.alert('Login réussi', `Utilisateur: ${response.data.user.email}`);
    } catch (error) {
      addLog(`❌ Login échoué: ${error.response?.status} ${error.response?.statusText}`);
      addLog(`Détails: ${error.response?.data?.detail || error.message}`);
      setStatus('❌ Auth échouée');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs effacés');
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Test de Connectivité</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Status: {status}</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={testConnectivity}>
          <Text style={styles.buttonText}>🔍 Test Connectivité</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testDiagnostic}>
          <Text style={styles.buttonText}>📊 Diagnostic Complet</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testLogin}>
          <Text style={styles.buttonText}>🔐 Test Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearLogs}>
          <Text style={styles.buttonText}>🗑️ Effacer Logs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Logs:</Text>
        <ScrollView style={styles.logsScroll}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#10B981',
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    color: 'white',
    fontSize: 16,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusContainer: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonsContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    width: '48%',
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  logsContainer: {
    flex: 1,
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logsScroll: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default TestScreen;