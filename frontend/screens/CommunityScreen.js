import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  TextInput,
  Alert,
  Linking,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function CommunityScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('FAQ');
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const chatRef = useRef(null);

  // Données FAQ
  const faqData = [
    {
      id: 1,
      question: "Comment identifier une maladie sur mes plantes ?",
      answer: "Utilisez notre fonction de diagnostic IA en prenant une photo claire de la plante affectée. L'intelligence artificielle analysera l'image et vous donnera un diagnostic précis avec les traitements recommandés.",
      category: "Diagnostic"
    },
    {
      id: 2,
      question: "Quels sont les meilleurs moments pour traiter ?",
      answer: "Les traitements sont généralement plus efficaces tôt le matin (6h-10h) ou en fin de journée (17h-19h), quand les températures sont plus fraîches et l'humidité appropriée.",
      category: "Traitement"
    },
    {
      id: 3,
      question: "Comment calculer les doses d'engrais ?",
      answer: "Utilisez notre calculateur d'engrais intégré. Sélectionnez votre type de culture, le nombre de plants, et l'outil calculera automatiquement les doses optimales.",
      category: "Fertilisation"
    }
  ];

  // Sites web agricoles recommandés
  const websites = [
    {
      id: 1,
      name: "FAO - Organisation des Nations Unies",
      description: "Organisation mondiale pour l'alimentation et l'agriculture",
      url: "https://www.fao.org",
      category: "Institution",
      icon: "🌍"
    },
    {
      id: 2,
      name: "CGIAR - Recherche Agricole",
      description: "Partenariat mondial de recherche agricole",
      url: "https://www.cgiar.org",
      category: "Recherche",
      icon: "🔬"
    },
    {
      id: 3,
      name: "AgriProFocus",
      description: "Réseau pour l'agribusiness en Afrique",
      url: "https://www.agriprofocus.com",
      category: "Réseau",
      icon: "🤝"
    },
    {
      id: 4,
      name: "ISRA Sénégal",
      description: "Institut Sénégalais de Recherche Agricole",
      url: "https://www.isra.sn",
      category: "Local",
      icon: "🇸🇳"
    }
  ];

  // Messages de chat simulés
  const initialChatMessages = [
    {
      id: 1,
      user: "Mamadou D.",
      message: "Les feuilles de maïs jaunissent, que faire ?",
      timestamp: "10:30",
      avatar: "👨‍🌾"
    },
    {
      id: 2,
      user: "Awa F.",
      message: "Essayez un apport d'azote, cela peut être une carence nutritionnelle",
      timestamp: "10:35",
      avatar: "👩‍🌾"
    },
    {
      id: 3,
      user: "System AgriGenAI",
      message: "💡 Conseil : Utilisez notre diagnostic IA pour une analyse précise !",
      timestamp: "10:36",
      avatar: "🤖",
      isSystem: true
    }
  ];

  React.useEffect(() => {
    setChatMessages(initialChatMessages);
  }, []);

  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };

  const openWebsite = (url) => {
    Alert.alert(
      'Ouvrir le lien',
      'Vous allez être redirigé vers un site externe',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Continuer', onPress: () => Linking.openURL(url) }
      ]
    );
  };

  const sendChatMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        user: "Vous",
        message: chatMessage.trim(),
        timestamp: new Date().toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        avatar: "🧑‍🌾",
        isOwn: true
      };
      
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage('');
      
      // Simulation d'une réponse automatique
      setTimeout(() => {
        const autoReply = {
          id: Date.now() + 1,
          user: "Assistant AgriGenAI",
          message: "Merci pour votre message ! Un membre de la communauté vous répondra bientôt.",
          timestamp: new Date().toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          avatar: "🤖",
          isSystem: true
        };
        setChatMessages(prev => [...prev, autoReply]);
      }, 1000);
    }
  };

  const renderFAQItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      onPress={() => Alert.alert(item.question, item.answer)}
    >
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#374151',
          flex: 1,
          marginRight: 8,
        }}>
          {item.question}
        </Text>
        <View style={{
          backgroundColor: '#E0F2FE',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{
            fontSize: 10,
            color: '#0369A1',
            fontWeight: '600',
          }}>
            {item.category}
          </Text>
        </View>
      </View>
      <Text style={{
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 18,
      }} numberOfLines={2}>
        {item.answer}
      </Text>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
      }}>
        <Ionicons name="chevron-forward" size={16} color="#10B981" />
      </View>
    </TouchableOpacity>
  );

  const renderWebsiteItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      onPress={() => openWebsite(item.url)}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <Text style={{ fontSize: 24, marginRight: 12 }}>{item.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#374151',
            marginBottom: 4,
          }}>
            {item.name}
          </Text>
          <Text style={{
            fontSize: 14,
            color: '#6B7280',
            lineHeight: 18,
          }}>
            {item.description}
          </Text>
        </View>
        <Ionicons name="open-outline" size={20} color="#10B981" />
      </View>
      <View style={{
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
      }}>
        <Text style={{
          fontSize: 10,
          color: '#10B981',
          fontWeight: '600',
        }}>
          {item.category}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderChatMessage = ({ item }) => (
    <View style={{
      marginBottom: 12,
      alignItems: item.isOwn ? 'flex-end' : 'flex-start',
    }}>
      <View style={{
        backgroundColor: item.isOwn ? '#10B981' : (item.isSystem ? '#F3F4F6' : 'white'),
        borderRadius: 16,
        padding: 12,
        maxWidth: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}>
        {!item.isOwn && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
          }}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>{item.avatar}</Text>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: item.isSystem ? '#6B7280' : '#10B981',
            }}>
              {item.user}
            </Text>
          </View>
        )}
        <Text style={{
          fontSize: 14,
          color: item.isOwn ? 'white' : '#374151',
          lineHeight: 18,
        }}>
          {item.message}
        </Text>
        <Text style={{
          fontSize: 10,
          color: item.isOwn ? 'rgba(255,255,255,0.8)' : '#9CA3AF',
          marginTop: 4,
          alignSelf: 'flex-end',
        }}>
          {item.timestamp}
        </Text>
      </View>
    </View>
  );

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
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
          COMMUNAUTÉ
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Onglets */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}>
        {['FAQ', 'Ministère', 'ISRA'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={{
              backgroundColor: activeTab === tab ? '#10B981' : 'transparent',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 8,
            }}
            onPress={() => handleTabPress(tab)}
          >
            <Text style={{
              color: activeTab === tab ? 'white' : '#6B7280',
              fontWeight: '600',
              fontSize: 14,
            }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {activeTab === 'FAQ' && (
          <View>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 16,
            }}>
              Questions Fréquentes
            </Text>
            {faqData.map(renderFAQItem)}
          </View>
        )}

        {(activeTab === 'Ministère' || activeTab === 'ISRA') && (
          <View>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 16,
            }}>
              {activeTab === 'Ministère' ? 'Sites Gouvernementaux' : 'Instituts de Recherche'}
            </Text>
            {websites
              .filter(site => 
                activeTab === 'Ministère' 
                  ? ['Institution', 'Local'].includes(site.category)
                  : ['Recherche', 'Réseau'].includes(site.category)
              )
              .map(renderWebsiteItem)}
          </View>
        )}

        {/* Section Chat Communauté */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 16,
          marginTop: 24,
          marginBottom: 24,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <Ionicons name="chatbubbles" size={20} color="#10B981" />
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#10B981',
              marginLeft: 8,
            }}>
              Chat Communauté
            </Text>
          </View>
          <Text style={{
            fontSize: 14,
            color: '#6B7280',
            marginBottom: 16,
            lineHeight: 20,
          }}>
            Échangez avec d'autres agriculteurs, partagez vos expériences et obtenez des conseils de la communauté.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#10B981',
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => setShowChat(true)}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
            }}>
              Rejoindre la Communauté
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Chat */}
      <Modal
        visible={showChat}
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
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <Ionicons name="close" size={24} color="#10B981" />
            </TouchableOpacity>
            <Text style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '600',
              color: '#10B981',
            }}>
              Chat Communauté
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            ref={chatRef}
            data={chatMessages}
            renderItem={renderChatMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            onContentSizeChange={() => chatRef.current?.scrollToEnd()}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{
              backgroundColor: 'white',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <TextInput
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  marginRight: 8,
                  maxHeight: 100,
                }}
                placeholder="Tapez votre message..."
                value={chatMessage}
                onChangeText={setChatMessage}
                multiline
              />
              <TouchableOpacity
                style={{
                  backgroundColor: '#10B981',
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={sendChatMessage}
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}