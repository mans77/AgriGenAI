import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AIAssistantService from '../services/AIAssistantService';
import { useLiveKit } from '../hooks/useLiveKit';

export default function ChatPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  // Hooks pour les fonctionnalités vocales
  const {
    isConnected: isLiveKitConnected,
    isRecording,
    startRecording,
    stopRecording,
    playAudio,
    synthesizeSpeech
  } = useLiveKit();

  useEffect(() => {
    if (isVisible && messages.length === 0) {
      // Tester la connexion à l'API au premier chargement
      testAPIConnection();
    }
  }, [isVisible]);

  const testAPIConnection = async () => {
    console.log('🔍 Test de connexion à l\'API...');
    
    // Message de bienvenue initial
    setMessages([
      {
        id: 1,
        text: "🌱 Bonjour ! Je suis votre assistant agricole intelligent.\n\n🔄 Vérification de la connexion à l'IA...",
        isBot: true,
        timestamp: new Date()
      }
    ]);

    try {
      const connectionTest = await AIAssistantService.testConnection();
      
      if (connectionTest.success) {
        // Connexion réussie
        setMessages([
          {
            id: 1,
            text: "🌱 Bonjour ! Je suis votre assistant agricole intelligent. Je peux vous aider avec :\n\n• 🔍 Diagnostic de cultures\n• 💰 Prix en temps réel\n• 🛒 E-commerce agricole\n• 🔧 Support technique\n• 🗣️ Discussion vocale\n\n✅ IA connectée et prête !\n\nComment puis-je vous aider aujourd'hui ?",
            isBot: true,
            timestamp: new Date()
          }
        ]);
        console.log('✅ Connexion IA réussie:', connectionTest.url);
      } else {
        // Erreur de connexion
        setMessages([
          {
            id: 1,
            text: "🌱 Bonjour ! Je suis votre assistant agricole intelligent.\n\n❌ Impossible de se connecter à l'IA backend.\n\n🔧 Vérifiez que :\n• Le serveur Python est démarré\n• L'URL de l'API est correcte\n• Votre connexion réseau fonctionne\n\n💡 Vous pouvez réessayer en fermant et rouvrant le chat.",
            isBot: true,
            timestamp: new Date(),
            type: 'error'
          }
        ]);
        console.error('❌ Échec connexion IA:', connectionTest.error);
      }
    } catch (error) {
      console.error('❌ Erreur test connexion:', error);
      setMessages([
        {
          id: 1,
          text: "🌱 Assistant agricole intelligent\n\n⚠️ Problème de connexion détecté.\n\nL'assistant IA n'est pas disponible pour le moment. Veuillez vérifier votre connexion et réessayer.",
          isBot: true,
          timestamp: new Date(),
          type: 'error'
        }
      ]);
    }
  };

  // Fonction spéciale pour les messages vocaux qui force la réponse audio
  const sendVoiceMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date(),
      isVoiceMessage: true // Marquer comme message vocal
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Utiliser le service d'assistant IA
      const response = await AIAssistantService.processMessage(messageText);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.text,
        isBot: true,
        timestamp: new Date(),
        type: response.type,
        confidence: response.confidence,
        sources: response.sources || [],
        suggestions: response.suggestions || []
      };

      setMessages(prev => [...prev, botMessage]);
      
      // TOUJOURS synthétiser et jouer l'audio pour les réponses aux messages vocaux
      console.log('🔊 Génération réponse audio pour message vocal...');
      const audioData = await synthesizeSpeech(response.text);
      if (audioData) {
        await playAudio(audioData);
      } else {
        console.log('⚠️ Impossible de générer l\'audio de la réponse');
      }
      
    } catch (error) {
      console.error('Erreur envoi message vocal:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Désolé, j'ai rencontré une erreur. Pouvez-vous reformuler votre demande ?",
        isBot: true,
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Utiliser le service d'assistant IA
      const response = await AIAssistantService.processMessage(messageToSend);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.text,
        isBot: true,
        timestamp: new Date(),
        type: response.type,
        confidence: response.confidence,
        sources: response.sources || [],
        suggestions: response.suggestions || []
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Si l'utilisateur a activé l'audio, synthétiser la réponse
      if (isLiveKitConnected) {
        const audioData = await synthesizeSpeech(response.text);
        if (audioData) {
          await playAudio(audioData);
        }
      }
      
    } catch (error) {
      console.error('Erreur envoi message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Désolé, j'ai rencontré une erreur. Pouvez-vous reformuler votre demande ?",
        isBot: true,
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecording = async () => {
    if (isRecording) {
      // Arrêter l'enregistrement
      try {
        const result = await stopRecording();
        if (result.success && result.transcript) {
          // Utiliser la transcription comme input
          setInputText(result.transcript);
          
          // Auto-envoyer le message transcrit avec marquage audio
          console.log('🗣️ Message vocal transcrit:', result.transcript);
          setTimeout(() => {
            sendVoiceMessage(result.transcript);
          }, 500); // Petit délai pour que l'utilisateur voie la transcription
        }
      } catch (error) {
        console.error('Erreur arrêt enregistrement:', error);
        Alert.alert('Erreur', 'Impossible d\'arrêter l\'enregistrement vocal.');
      }
    } else {
      // Démarrer l'enregistrement
      try {
        const success = await startRecording();
        if (!success) {
          Alert.alert(
            'Fonctionnalité vocale', 
            'L\'interface vocale sera bientôt disponible avec LiveKit.\nEn attendant, utilisez le chat textuel.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Erreur démarrage enregistrement:', error);
        Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement vocal.');
      }
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Bouton flottant */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 30,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#10B981',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
          zIndex: 1000,
        }}
        onPress={() => setIsVisible(true)}
      >
        <Ionicons name="chatbubbles" size={28} color="white" />
      </TouchableOpacity>

      {/* Modal du chat */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: 'white',
            height: '75%',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 12,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#10B981',
                }}>
                  🤖 Assistant Agricole IA
                </Text>
              </View>

              <TouchableOpacity
                onPress={testAPIConnection}
                style={{
                  padding: 8,
                  marginRight: 8,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 20,
                }}
              >
                <Ionicons name="refresh" size={16} color="#10B981" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleVoiceRecording}
                style={{
                  padding: 8,
                  marginRight: 8,
                  backgroundColor: isRecording ? '#EF4444' : (isLiveKitConnected ? '#10B981' : '#9CA3AF'),
                  borderRadius: 20,
                }}
              >
                <Ionicons 
                  name={isRecording ? "mic" : "mic-outline"} 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={{ padding: 8 }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1, paddingVertical: 16 }}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={{
                    alignSelf: message.isBot ? 'flex-start' : 'flex-end',
                    marginBottom: 12,
                    maxWidth: '80%',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: message.isBot ? '#F3F4F6' : '#10B981',
                      padding: 12,
                      borderRadius: 16,
                      borderBottomLeftRadius: message.isBot ? 4 : 16,
                      borderBottomRightRadius: message.isBot ? 16 : 4,
                    }}
                  >
                    <Text style={{
                      color: message.isBot ? '#374151' : 'white',
                      fontSize: 14,
                      lineHeight: 20,
                    }}>
                      {message.text}
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 10,
                    color: '#9CA3AF',
                    marginTop: 4,
                    textAlign: message.isBot ? 'left' : 'right',
                  }}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              ))}

              {isLoading && (
                <View style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#F3F4F6',
                  padding: 12,
                  borderRadius: 16,
                  borderBottomLeftRadius: 4,
                  marginBottom: 12,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#10B981" />
                    <Text style={{
                      color: '#6B7280',
                      fontSize: 14,
                      marginLeft: 8,
                    }}>
                      L'IA réfléchit...
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 4,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  fontSize: 14,
                  maxHeight: 80,
                }}
                placeholder="Posez votre demande agricole..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
                onSubmitEditing={sendMessage}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={{
                  marginLeft: 8,
                  backgroundColor: '#10B981',
                  borderRadius: 20,
                  padding: 10,
                  opacity: isLoading || !inputText.trim() ? 0.5 : 1,
                }}
                onPress={sendMessage}
                disabled={isLoading || !inputText.trim()}
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}