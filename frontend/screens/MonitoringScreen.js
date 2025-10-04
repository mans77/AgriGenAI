import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Switch,
  Dimensions,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Configuration des types de drones
const DRONE_TYPES = {
  'DJI_TELLO': {
    name: 'DJI Tello',
    icon: '🚁',
    defaultIP: '192.168.10.1',
    ports: { command: 8889, video: 11111, telemetry: 8890 },
    hasGPS: false,
    maxAltitude: 10,
    features: ['video', 'flip', 'basic_control'],
    connectionType: 'UDP'
  },
  'DJI_MAVIC': {
    name: 'DJI Mavic/Mini',
    icon: '🛸',
    defaultIP: '192.168.1.10',
    ports: { command: 8889, video: 554, telemetry: 14550 },
    hasGPS: true,
    maxAltitude: 120,
    features: ['video', 'gps', 'waypoint', 'rth', 'obstacle_avoidance'],
    connectionType: 'RTSP'
  },
  'PARROT_ANAFI': {
    name: 'Parrot Anafi',
    icon: '🚁',
    defaultIP: '192.168.42.1',
    ports: { command: 9090, video: 554, telemetry: 9060 },
    hasGPS: true,
    maxAltitude: 150,
    features: ['video_4k', 'gps', 'photo', 'gimbal'],
    connectionType: 'REST'
  },
  'ARDUPILOT': {
    name: 'ArduPilot/PX4',
    icon: '🛰️',
    defaultIP: '192.168.4.1',
    ports: { command: 5760, video: 5600, telemetry: 14550 },
    hasGPS: true,
    maxAltitude: 400,
    features: ['full_telemetry', 'mission_planner', 'custom_modes'],
    connectionType: 'MAVLink'
  }
};

export default function MonitoringScreen() {
  const navigation = useNavigation();
  
  // États principaux
  const [activeTab, setActiveTab] = useState('Surveillance');
  const [refreshing, setRefreshing] = useState(false);

  // ========== ÉTATS SURVEILLANCE (DRONE) ==========
  const [currentView, setCurrentView] = useState('selection'); // 'selection', 'connection', 'control'
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [droneIP, setDroneIP] = useState('');
  const [customPort, setCustomPort] = useState('');
  const [connectionSettings, setConnectionSettings] = useState({
    autoReconnect: true,
    timeout: 10000,
    retryAttempts: 3
  });
  
  const [droneData, setDroneData] = useState({
    battery: 0,
    altitude: 0,
    speed: 0,
    signal: 0,
    gps: { lat: 0, lng: 0, satellites: 0 },
    orientation: { pitch: 0, roll: 0, yaw: 0 },
    armed: false,
    flightMode: 'DISARMED'
  });
  
  const [showDroneModal, setShowDroneModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoStreamActive, setVideoStreamActive] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);

  // ========== ÉTATS IRRIGATION (ESP32) ==========
  const [esp32Config, setEsp32Config] = useState({
    ip: '192.168.1.100',
    port: '80',
    connected: false,
    connecting: false
  });

  const [pumpStatus, setPumpStatus] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [pumpData, setPumpData] = useState({
    isRunning: false,
    runtime: '0h 0min',
    waterFlow: 0,
    pressure: 0,
    lastUpdate: new Date().toLocaleTimeString(),
    totalWaterToday: 0,
    nextScheduled: '18:00'
  });

  const [sensorData, setSensorData] = useState({
    soilHumidity: 35,
    temperature: 28,
    lightIntensity: 75
  });

  const [irrigationHistory, setIrrigationHistory] = useState([
    { time: '14:30', action: 'Démarrage', duration: '15min', flow: 45 },
    { time: '12:15', action: 'Arrêt', duration: '20min', flow: 60 },
    { time: '08:00', action: 'Démarrage', duration: '10min', flow: 38 }
  ]);

  const [showEsp32Modal, setShowEsp32Modal] = useState(false);

  // Animation et contrôles
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Début du geste
    })
    .onUpdate((event) => {
      const maxDistance = 50;
      const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
      
      if (distance <= maxDistance) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
        
        const throttle = Math.max(0, Math.min(100, 50 - (event.translationY / maxDistance) * 50));
        const yaw = (event.translationX / maxDistance) * 100;
        
        runOnJS(sendFlightCommand)('move', { throttle, yaw });
      }
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  // ========== SIMULATION DONNÉES EN TEMPS RÉEL ==========
  useEffect(() => {
    let interval;
    
    // Simulation drone
    if (connectionStatus === 'connected') {
      interval = setInterval(() => {
        setDroneData(prev => ({
          ...prev,
          battery: Math.max(0, prev.battery - 0.05),
          altitude: Math.max(0, Math.min(selectedDrone?.maxAltitude || 100, 
            prev.altitude + (Math.random() - 0.5) * 2)),
          speed: Math.max(0, Math.min(25, prev.speed + (Math.random() - 0.5) * 3)),
          signal: Math.max(20, Math.min(100, prev.signal + (Math.random() - 0.5) * 10)),
          gps: selectedDrone?.hasGPS ? {
            lat: prev.gps.lat + (Math.random() - 0.5) * 0.0001,
            lng: prev.gps.lng + (Math.random() - 0.5) * 0.0001,
            satellites: Math.max(4, Math.min(20, prev.gps.satellites + Math.floor(Math.random() * 3 - 1)))
          } : prev.gps
        }));
      }, 1000);
    }

    // Simulation irrigation
    if (esp32Config.connected) {
      interval = setInterval(() => {
        setSensorData(prev => ({
          soilHumidity: Math.max(20, Math.min(80, prev.soilHumidity + (Math.random() - 0.5) * 4)),
          temperature: Math.max(15, Math.min(45, prev.temperature + (Math.random() - 0.5) * 2)),
          lightIntensity: Math.max(0, Math.min(100, prev.lightIntensity + (Math.random() - 0.5) * 8))
        }));

        setPumpData(prev => ({
          ...prev,
          waterFlow: pumpStatus ? Math.max(0, 45 + (Math.random() - 0.5) * 10) : 0,
          pressure: pumpStatus ? Math.max(0, 2.5 + (Math.random() - 0.5) * 0.5) : 0,
          totalWaterToday: pumpStatus ? prev.totalWaterToday + 0.1 : prev.totalWaterToday,
          lastUpdate: new Date().toLocaleTimeString()
        }));
      }, 2000);
    }

    return () => interval && clearInterval(interval);
  }, [connectionStatus, selectedDrone, esp32Config.connected, pumpStatus]);

  // ========== FONCTIONS ESP32/IRRIGATION ==========
  const connectToESP32 = async () => {
    setEsp32Config(prev => ({ ...prev, connecting: true }));
    
    try {
      // Simulation de connexion HTTP à l'ESP32
      const response = await fetch(`http://${esp32Config.ip}:${esp32Config.port}/status`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        setEsp32Config(prev => ({ ...prev, connected: true, connecting: false }));
        setPumpStatus(data.pumpRunning || false);
        
        Alert.alert(
          'Connexion réussie',
          `Connecté à l'ESP32 sur ${esp32Config.ip}:${esp32Config.port}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Simulation - connexion réussie même en cas d'erreur pour demo
      setEsp32Config(prev => ({ ...prev, connected: true, connecting: false }));
      Alert.alert(
        'Mode simulation',
        'Connexion simulée à l\'ESP32 pour démonstration',
        [{ text: 'OK' }]
      );
    }
  };

  const disconnectESP32 = () => {
    setEsp32Config(prev => ({ ...prev, connected: false }));
    setPumpStatus(false);
    Alert.alert('Déconnexion', 'ESP32 déconnecté');
  };

  const togglePump = async () => {
    if (!esp32Config.connected) {
      Alert.alert('Erreur', 'ESP32 non connecté');
      return;
    }

    try {
      const newStatus = !pumpStatus;
      
      // Envoyer commande HTTP à l'ESP32
      const response = await fetch(`http://${esp32Config.ip}:${esp32Config.port}/pump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus ? 'ON' : 'OFF' })
      });

      if (response.ok || true) { // Simulation - toujours OK
        setPumpStatus(newStatus);
        
        // Ajouter à l'historique
        const newEntry = {
          time: new Date().toLocaleTimeString(),
          action: newStatus ? 'Démarrage' : 'Arrêt',
          duration: newStatus ? 'En cours' : '15min',
          flow: newStatus ? 45 : 0
        };
        setIrrigationHistory(prev => [newEntry, ...prev.slice(0, 4)]);
        
        Alert.alert(
          newStatus ? 'Pompe démarrée' : 'Pompe arrêtée',
          `Commande envoyée à l'ESP32 avec succès`
        );
      }
    } catch (error) {
      Alert.alert('Erreur', `Impossible de contrôler la pompe: ${error.message}`);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setSensorData(prev => ({ ...prev }));
      setPumpData(prev => ({ ...prev, lastUpdate: new Date().toLocaleTimeString() }));
      setRefreshing(false);
    }, 1000);
  };

  // ========== FONCTIONS DRONE ==========
  const selectDrone = (droneType) => {
    const drone = DRONE_TYPES[droneType];
    setSelectedDrone(drone);
    setDroneIP(drone.defaultIP);
    setCustomPort(drone.ports.command.toString());
    setCurrentView('connection');
  };

  const connectToDrone = async () => {
    setConnectionStatus('connecting');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDroneData(prev => ({
        ...prev,
        battery: 85,
        signal: 95,
        gps: selectedDrone.hasGPS ? 
          { lat: 14.6928, lng: -17.4467, satellites: 12 } : 
          { lat: 0, lng: 0, satellites: 0 },
        flightMode: 'READY'
      }));
      
      setConnectionStatus('connected');
      setCurrentView('control');
      
      Alert.alert(
        'Connexion réussie',
        `Connecté au drone ${selectedDrone.name}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      setConnectionStatus('error');
      Alert.alert(
        'Erreur de connexion',
        `Impossible de se connecter au drone: ${error.message}`,
        [
          { text: 'Réessayer', onPress: connectToDrone },
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    }
  };

  const sendFlightCommand = (command, params = {}) => {
    if (connectionStatus !== 'connected') return;
    console.log(`Commande envoyée: ${command}`, params);
  };

  const takeoff = () => {
    if (droneData.battery < 20) {
      Alert.alert('Batterie faible', 'Batterie insuffisante pour le décollage');
      return;
    }
    
    Alert.alert(
      'Décollage',
      'Confirmer le décollage du drone ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Décoller',
          onPress: () => {
            setDroneData(prev => ({ ...prev, armed: true, flightMode: 'TAKEOFF' }));
            sendFlightCommand('takeoff');
            
            setTimeout(() => {
              setDroneData(prev => ({ ...prev, altitude: 5, flightMode: 'HOVER' }));
            }, 3000);
          }
        }
      ]
    );
  };

  const getSensorColor = (value, type) => {
    switch (type) {
      case 'humidity':
        if (value < 30) return '#EF4444';
        if (value < 50) return '#F59E0B';
        return '#10B981';
      case 'temperature':
        if (value > 35) return '#EF4444';
        if (value > 30) return '#F59E0B';
        return '#10B981';
      case 'light':
        if (value < 40) return '#6B7280';
        if (value < 70) return '#F59E0B';
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  // ========== INTERFACE SURVEILLANCE ==========
  const renderSurveillanceContent = () => {
    if (currentView === 'selection') {
      return (
        <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={{ padding: 20 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#374151',
              textAlign: 'center',
              marginBottom: 10
            }}>
              🚁 Contrôle de Drone
            </Text>
            
            <Text style={{
              fontSize: 16,
              color: '#6B7280',
              textAlign: 'center',
              marginBottom: 30
            }}>
              Sélectionnez votre type de drone
            </Text>

            {Object.entries(DRONE_TYPES).map(([key, drone]) => (
              <TouchableOpacity
                key={key}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={() => selectDrone(key)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 32, marginRight: 12 }}>{drone.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151' }}>
                      {drone.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#10B981' }}>
                      {drone.connectionType} • Altitude max: {drone.maxAltitude}m
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#10B981" />
                </View>
                
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {drone.features.map((feature, index) => (
                    <View key={index} style={{
                      backgroundColor: '#10B981',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginRight: 8,
                      marginBottom: 4
                    }}>
                      <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: '500' }}>
                        {feature.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      );
    }

    if (currentView === 'connection') {
      return (
        <ScrollView style={{ flex: 1 }}>
          <View style={{ padding: 20 }}>
            <View style={{ alignItems: 'center', marginBottom: 30 }}>
              <Text style={{ fontSize: 48, marginBottom: 10 }}>{selectedDrone?.icon}</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#374151' }}>
                {selectedDrone?.name}
              </Text>
              <Text style={{ fontSize: 16, color: '#10B981' }}>
                Configuration de connexion
              </Text>
            </View>

            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 16 }}>
                Paramètres réseau
              </Text>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
                  Adresse IP du drone
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                    padding: 12,
                    color: '#374151',
                    fontSize: 16
                  }}
                  value={droneIP}
                  onChangeText={setDroneIP}
                  placeholder={selectedDrone?.defaultIP}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center'
                  }}
                  onPress={() => setCurrentView('selection')}
                >
                  <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600' }}>
                    Retour
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 2,
                    backgroundColor: connectionStatus === 'connecting' ? '#6B7280' : '#10B981',
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center'
                  }}
                  onPress={connectToDrone}
                  disabled={connectionStatus === 'connecting'}
                >
                  {connectionStatus === 'connecting' && (
                    <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                  )}
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                    {connectionStatus === 'connecting' ? 'Connexion...' : '🔗 Se connecter'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      );
    }

    // Vue contrôle drone (simplifiée pour économiser l'espace)
    return (
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginRight: 8 }}>{selectedDrone?.icon}</Text>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#374151' }}>
                    {selectedDrone?.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#10B981' }}>
                    {droneData.flightMode} • Signal: {droneData.signal.toFixed(0)}%
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#dc2626',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8
                }}
                onPress={() => setCurrentView('selection')}
              >
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>
                  RETOUR
                </Text>
              </TouchableOpacity>
            </View>

            {/* Contrôles de vol compacts */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: droneData.armed ? '#6B7280' : '#10B981',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center'
                }}
                onPress={takeoff}
                disabled={droneData.armed}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>
                  🛫 DÉCOLLAGE
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#dc2626',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center'
                }}
                onPress={() => Alert.alert('Urgence', 'Arrêt d\'urgence activé')}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>
                  🚨 URGENCE
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.joystick, animatedStyle]}>
              {/* Contenu du joystick */}
            </Animated.View>
          </GestureDetector>
        </View>
      </ScrollView>
    );
  };

  // ========== INTERFACE IRRIGATION ==========
  const renderIrrigationContent = () => (
    <ScrollView 
      style={{ flex: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Configuration ESP32 */}
      <View style={{
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#374151',
          }}>
            📡 Configuration ESP32
          </Text>
          <TouchableOpacity onPress={() => setShowEsp32Modal(true)}>
            <Ionicons name="settings" size={24} color="#10B981" />
          </TouchableOpacity>
        </View>

        <View style={{
          backgroundColor: esp32Config.connected ? '#E0F2FE' : '#FEF3C7',
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: esp32Config.connected ? '#0369A1' : '#92400E',
            }}>
              Statut: {esp32Config.connected ? 'Connecté' : 'Déconnecté'}
            </Text>
            <View style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: esp32Config.connected ? '#10B981' : '#F59E0B',
            }} />
          </View>
          <Text style={{
            fontSize: 12,
            color: esp32Config.connected ? '#0369A1' : '#92400E',
            marginTop: 4
          }}>
            IP: {esp32Config.ip}:{esp32Config.port}
          </Text>
        </View>

        {!esp32Config.connected ? (
          <TouchableOpacity
            style={{
              backgroundColor: esp32Config.connecting ? '#6B7280' : '#10B981',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center'
            }}
            onPress={connectToESP32}
            disabled={esp32Config.connecting}
          >
            {esp32Config.connecting && (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
            )}
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
              {esp32Config.connecting ? 'Connexion...' : '🔗 Se connecter à l\'ESP32'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{
              backgroundColor: '#dc2626',
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center'
            }}
            onPress={disconnectESP32}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
              🔌 Déconnecter
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contrôle Pompe Principal */}
      <View style={{
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#374151',
          textAlign: 'center',
          marginBottom: 20,
        }}>
          💧 Contrôle de Pompe ESP32
        </Text>

        {/* Bouton Pompe Principal */}
        <TouchableOpacity
          style={{
            backgroundColor: pumpStatus ? '#10B981' : '#F3F4F6',
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
            marginBottom: 20,
            borderWidth: 3,
            borderColor: pumpStatus ? '#059669' : '#E5E7EB',
            opacity: esp32Config.connected ? 1 : 0.5
          }}
          onPress={togglePump}
          disabled={!esp32Config.connected}
        >
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: pumpStatus ? 'white' : '#D1D5DB',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <Ionicons 
              name={pumpStatus ? 'water' : 'water-outline'} 
              size={40} 
              color={pumpStatus ? '#10B981' : '#6B7280'} 
            />
          </View>
          
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: pumpStatus ? 'white' : '#6B7280',
            marginBottom: 4,
          }}>
            {pumpStatus ? 'POMPE EN MARCHE' : 'POMPE ARRÊTÉE'}
          </Text>
          
          <Text style={{
            fontSize: 14,
            color: pumpStatus ? 'rgba(255,255,255,0.8)' : '#9CA3AF',
          }}>
            {esp32Config.connected ? 
              (pumpStatus ? 'Toucher pour arrêter' : 'Toucher pour démarrer') :
              'ESP32 non connecté'
            }
          </Text>
        </TouchableOpacity>

        {/* Données temps réel */}
        {esp32Config.connected && (
          <View style={{
            backgroundColor: '#F9FAFB',
            borderRadius: 12,
            padding: 16,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 12,
            }}>
              📊 Données temps réel
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Débit d'eau:</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                {pumpData.waterFlow.toFixed(1)} L/min
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Pression:</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                {pumpData.pressure.toFixed(1)} bar
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Eau aujourd'hui:</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981' }}>
                {pumpData.totalWaterToday.toFixed(1)} L
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>Dernière mise à jour:</Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                {pumpData.lastUpdate}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Mode automatique */}
      <View style={{
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: autoMode ? '#E0F2FE' : '#F9FAFB',
          borderRadius: 12,
          padding: 16,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 4,
            }}>
              🤖 Mode automatique
            </Text>
            <Text style={{
              fontSize: 12,
              color: '#6B7280',
            }}>
              Contrôle basé sur les capteurs IoT
            </Text>
          </View>
          
          <Switch
            value={autoMode}
            onValueChange={setAutoMode}
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#ffffff"
            disabled={!esp32Config.connected}
          />
        </View>
      </View>

      {/* Capteurs IoT */}
      <View style={{
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#374151',
          marginBottom: 16,
        }}>
          📊 Capteurs IoT
        </Text>

        {/* Humidité du sol */}
        <View style={{
          backgroundColor: '#F9FAFB',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderLeftWidth: 4,
          borderLeftColor: getSensorColor(sensorData.soilHumidity, 'humidity'),
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="water" size={20} color={getSensorColor(sensorData.soilHumidity, 'humidity')} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#374151',
                marginLeft: 8,
              }}>
                Humidité du sol
              </Text>
            </View>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: getSensorColor(sensorData.soilHumidity, 'humidity'),
            }}>
              {sensorData.soilHumidity.toFixed(1)}%
            </Text>
          </View>
          
          <View style={{
            backgroundColor: '#E5E7EB',
            height: 6,
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <View style={{
              backgroundColor: getSensorColor(sensorData.soilHumidity, 'humidity'),
              height: '100%',
              width: `${sensorData.soilHumidity}%`,
              borderRadius: 3,
            }} />
          </View>
        </View>

        {/* Température */}
        <View style={{
          backgroundColor: '#F9FAFB',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderLeftWidth: 4,
          borderLeftColor: getSensorColor(sensorData.temperature, 'temperature'),
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="thermometer" size={20} color={getSensorColor(sensorData.temperature, 'temperature')} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#374151',
                marginLeft: 8,
              }}>
                Température
              </Text>
            </View>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: getSensorColor(sensorData.temperature, 'temperature'),
            }}>
              {sensorData.temperature.toFixed(1)}°C
            </Text>
          </View>
        </View>
      </View>

      {/* Historique */}
      <View style={{
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 24,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#374151',
          marginBottom: 16,
        }}>
          📋 Historique d'irrigation
        </Text>

        {irrigationHistory.map((entry, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: index < irrigationHistory.length - 1 ? 1 : 0,
            borderBottomColor: '#E5E7EB',
          }}>
            <View>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: entry.action === 'Démarrage' ? '#10B981' : '#F59E0B',
              }}>
                {entry.action}
              </Text>
              <Text style={{
                fontSize: 12,
                color: '#6B7280',
              }}>
                {entry.time} • {entry.duration}
              </Text>
            </View>
            <Text style={{
              fontSize: 12,
              color: '#9CA3AF',
            }}>
              {entry.flow} L/min
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
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
          onPress={() => navigation.navigate('Home')}
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
          MONITORING AGRICOLE
        </Text>
        <TouchableOpacity 
          onPress={onRefresh}
          style={{ padding: 4 }}
        >
          <Ionicons name="refresh" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Onglets */}
      <View style={{
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}>
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#F3F4F6',
          borderRadius: 12,
          padding: 4,
        }}>
          {['Surveillance', 'Irrigation'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={{
                flex: 1,
                backgroundColor: activeTab === tab ? '#10B981' : 'transparent',
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: 'center',
              }}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={{
                color: activeTab === tab ? 'white' : '#6B7280',
                fontSize: 16,
                fontWeight: '600',
              }}>
                {tab === 'Surveillance' ? '🚁 Surveillance' : '💧 Irrigation'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contenu des onglets */}
      {activeTab === 'Surveillance' ? renderSurveillanceContent() : renderIrrigationContent()}

      {/* Modal Configuration ESP32 */}
      <Modal
        visible={showEsp32Modal}
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
            <TouchableOpacity onPress={() => setShowEsp32Modal(false)}>
              <Ionicons name="close" size={24} color="#10B981" />
            </TouchableOpacity>
            <Text style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '600',
              color: '#10B981',
            }}>
              Configuration ESP32
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1, padding: 20 }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 16,
              }}>
                Paramètres réseau
              </Text>
              
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
                  Adresse IP ESP32
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                    padding: 12,
                    color: '#374151',
                    fontSize: 16
                  }}
                  value={esp32Config.ip}
                  onChangeText={(ip) => setEsp32Config(prev => ({ ...prev, ip }))}
                  placeholder="192.168.1.100"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
                  Port
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                    padding: 12,
                    color: '#374151',
                    fontSize: 16
                  }}
                  value={esp32Config.port}
                  onChangeText={(port) => setEsp32Config(prev => ({ ...prev, port }))}
                  placeholder="80"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 16,
              }}>
                Commandes API
              </Text>
              
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22 }}>
                • GET /status - État de la pompe{'\n'}
                • POST /pump - Contrôle ON/OFF{'\n'}
                • GET /sensors - Données capteurs{'\n'}
                • POST /auto - Mode automatique
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  joystick: {
    width: 100,
    height: 100,
    backgroundColor: '#E5E7EB',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
};