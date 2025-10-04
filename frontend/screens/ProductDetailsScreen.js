import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Dimensions,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { product } = route.params;

  const [quantity, setQuantity] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Données de contact pour la commande
  const [orderContact, setOrderContact] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  // Produits suggérés (simples exemples basés sur la catégorie)
  const suggestedProducts = [
    {
      id: 101,
      name: 'Oranges premium',
      price: '4000',
      image: 'https://via.placeholder.com/120x120/f97316/ffffff?text=Orange',
    },
    {
      id: 102,
      name: 'Oranges bio',
      price: '4500',
      image: 'https://via.placeholder.com/120x120/f97316/ffffff?text=Bio',
    },
    {
      id: 103,
      name: 'Oranges locales',
      price: '3500',
      image: 'https://via.placeholder.com/120x120/f97316/ffffff?text=Local',
    },
  ];

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const addToCart = () => {
    setIsInCart(true);
    Alert.alert(
      'Produit ajouté au panier', 
      `${quantity} x ${product.name} ajouté(s) à votre panier`,
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  const buyNow = () => {
    setShowPurchaseModal(true);
  };

  const contactSeller = () => {
    setShowContactModal(true);
  };

  const submitOrder = () => {
    if (!orderContact.name.trim() || !orderContact.phone.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir votre nom et téléphone');
      return;
    }

    const orderDetails = {
      product: product.name,
      quantity,
      totalPrice: (parseInt(product.price) * quantity).toLocaleString(),
      customer: orderContact,
      seller: {
        name: product.seller,
        phone: product.contact
      }
    };

    setShowPurchaseModal(false);
    
    Alert.alert(
      'Commande confirmée !', 
      `Votre commande de ${quantity} ${product.name} a été envoyée au vendeur.\n\nTotal: ${orderDetails.totalPrice} FCFA\n\nLe vendeur vous contactera sous peu.`,
      [
        { 
          text: 'OK', 
          onPress: () => {
            // Réinitialiser le formulaire
            setOrderContact({ name: '', phone: '', address: '', notes: '' });
            setQuantity(1);
          }
        }
      ]
    );
  };

  const directContact = () => {
    setShowContactModal(false);
    Alert.alert(
      'Contacter le vendeur',
      `${product.seller}\nTéléphone: ${product.contact}\nLocalisation: ${product.location}`,
      [
        { text: 'Appeler', onPress: () => Alert.alert('Info', 'Fonction d\'appel à implémenter') },
        { text: 'WhatsApp', onPress: () => Alert.alert('Info', 'Redirection WhatsApp à implémenter') },
        { text: 'SMS', onPress: () => Alert.alert('Info', 'Fonction SMS à implémenter') },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return parseInt(price).toLocaleString();
  };

  const goToSuggestedProduct = (suggestedProduct) => {
    // Naviguer vers un autre produit (simulation)
    Alert.alert('Navigation', `Aller vers ${suggestedProduct.name}`);
  };

  const shareProduct = () => {
    Alert.alert(
      'Partager le produit',
      'Choisissez une option de partage',
      [
        { text: 'WhatsApp', onPress: () => Alert.alert('Info', 'Partage WhatsApp à implémenter') },
        { text: 'SMS', onPress: () => Alert.alert('Info', 'Partage SMS à implémenter') },
        { text: 'Email', onPress: () => Alert.alert('Info', 'Partage Email à implémenter') },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header avec navigation */}
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
          ACHATS
        </Text>
        
        <TouchableOpacity 
          onPress={shareProduct}
          style={{ padding: 4 }}
        >
          <Ionicons name="share-outline" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Image du produit avec indicateurs */}
        <View style={{ position: 'relative' }}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={{ height: 300 }}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(newIndex);
            }}
          >
            {(Array.isArray(product.images) ? product.images : [product.images]).map((image, index) => (
              <Image
                key={index}
                source={{ uri: typeof image === 'string' ? image : image.uri }}
                style={{ width, height: 300 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Indicateurs de pages */}
          {product.images && product.images.length > 1 && (
            <View style={{
              position: 'absolute',
              bottom: 16,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
            }}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: currentImageIndex === index ? '#10B981' : 'rgba(255,255,255,0.5)',
                    marginHorizontal: 4,
                  }}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ padding: 16 }}>
          {/* Titre du produit */}
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#374151',
            marginBottom: 8,
          }}>
            {product.name}
          </Text>

          {/* Description longue comme dans la maquette */}
          <Text style={{
            fontSize: 14,
            color: '#6B7280',
            lineHeight: 20,
            marginBottom: 16,
          }}>
            Il s'agit d'un fruit établi qui rencontrera la demande, car il est apprécié par les acheteurs du secteur privé. Leurs arômes intenses permettent de les utiliser. Le point d'utiliser Calme laure en est un qui ne permet pas l'utilisation normale d'obtenir la distribution de refrain, car il oppose à la fois la liberté.
          </Text>

          {/* Prix et contrôles de quantité */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}>
            {/* Prix */}
            <Text style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#10B981',
            }}>
              {formatPrice(product.price)} FCFA
            </Text>

            {/* Contrôles de quantité */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: 25,
              borderWidth: 2,
              borderColor: '#10B981',
              paddingHorizontal: 4,
            }}>
              <TouchableOpacity
                onPress={decreaseQuantity}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#10B981',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="remove" size={20} color="white" />
              </TouchableOpacity>

              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#10B981',
                marginHorizontal: 16,
                minWidth: 30,
                textAlign: 'center',
              }}>
                {quantity}
              </Text>

              <TouchableOpacity
                onPress={increaseQuantity}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#10B981',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={{
            flexDirection: 'row',
            marginBottom: 24,
            gap: 12,
          }}>
            {/* Bouton Panier */}
            <TouchableOpacity
              onPress={addToCart}
              style={{
                flex: 1,
                backgroundColor: isInCart ? '#6B7280' : 'white',
                borderWidth: 2,
                borderColor: '#10B981',
                borderRadius: 12,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons 
                name={isInCart ? "checkmark-circle" : "cart"} 
                size={20} 
                color={isInCart ? 'white' : '#10B981'} 
              />
              <Text style={{
                color: isInCart ? 'white' : '#10B981',
                fontSize: 16,
                fontWeight: '600',
                marginLeft: 8,
              }}>
                {isInCart ? 'Ajouté' : 'Panier'}
              </Text>
            </TouchableOpacity>

            {/* Bouton Contact */}
            <TouchableOpacity
              onPress={contactSeller}
              style={{
                flex: 1,
                backgroundColor: '#34D399',
                borderRadius: 12,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="call" size={20} color="white" />
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                marginLeft: 8,
              }}>
                Appeler
              </Text>
            </TouchableOpacity>
          </View>

          {/* Suggestions de produits */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 12,
            }}>
              Suggestions d'autres produits
            </Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {suggestedProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => goToSuggestedProduct(item)}
                  style={{
                    marginRight: 12,
                    alignItems: 'center',
                  }}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                  />
                  <Text style={{
                    fontSize: 12,
                    color: '#374151',
                    textAlign: 'center',
                    maxWidth: 80,
                  }} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: '#10B981',
                    fontWeight: '600',
                  }}>
                    {formatPrice(item.price)} F
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Informations vendeur */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 12,
            }}>
              Informations vendeur
            </Text>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#E0F2FE',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="person" size={20} color="#0369A1" />
              </View>
              
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#374151',
                }}>
                  {product.seller}
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 2,
                }}>
                  <Ionicons name="location" size={12} color="#6B7280" />
                  <Text style={{
                    fontSize: 12,
                    color: '#6B7280',
                    marginLeft: 4,
                  }}>
                    {product.location}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={{
              fontSize: 12,
              color: '#6B7280',
              marginBottom: 12,
            }}>
              Publié le {formatDate(product.timestamp)}
            </Text>

            {/* Badge de condition */}
            <View style={{
              backgroundColor: product.condition === 'Neuf' ? '#E0F2FE' : '#FEF3C7',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              alignSelf: 'flex-start',
            }}>
              <Text style={{
                fontSize: 12,
                color: product.condition === 'Neuf' ? '#0369A1' : '#92400E',
                fontWeight: '600',
              }}>
                État: {product.condition}
              </Text>
            </View>
          </View>

          {/* Informations produit */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 100,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#374151',
              marginBottom: 12,
            }}>
              Détails du produit
            </Text>
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6',
            }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>Catégorie</Text>
              <Text style={{ color: '#374151', fontWeight: '500', fontSize: 14 }}>
                {product.category}
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6',
            }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>Prix unitaire</Text>
              <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 14 }}>
                {formatPrice(product.price)} FCFA
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
            }}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>Total ({quantity} unité{quantity > 1 ? 's' : ''})</Text>
              <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 16 }}>
                {formatPrice(parseInt(product.price) * quantity)} FCFA
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bouton d'achat fixe en bas */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#10B981',
            borderRadius: 12,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={buyNow}
        >
          <Ionicons name="card" size={20} color="white" />
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
          }}>
            Acheter maintenant - {formatPrice(parseInt(product.price) * quantity)} FCFA
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de commande */}
      <Modal
        visible={showPurchaseModal}
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
            <TouchableOpacity onPress={() => setShowPurchaseModal(false)}>
              <Ionicons name="close" size={24} color="#10B981" />
            </TouchableOpacity>
            <Text style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '600',
              color: '#10B981',
            }}>
              Finaliser la commande
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }}>
            {/* Résumé de commande */}
            <View style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 12,
              }}>
                Résumé de votre commande
              </Text>
              
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Image
                  source={{ uri: Array.isArray(product.images) ? product.images[0] : product.images }}
                  style={{ width: 60, height: 60, borderRadius: 8 }}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                    {product.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    Quantité: {quantity}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#10B981', fontWeight: '600' }}>
                    {formatPrice(parseInt(product.price) * quantity)} FCFA
                  </Text>
                </View>
              </View>
            </View>

            {/* Informations de livraison */}
            <View style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 12,
              }}>
                Vos informations
              </Text>

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  backgroundColor: '#F9FAFB',
                  marginBottom: 12,
                }}
                placeholder="Votre nom complet *"
                value={orderContact.name}
                onChangeText={(text) => setOrderContact(prev => ({ ...prev, name: text }))}
              />

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  backgroundColor: '#F9FAFB',
                  marginBottom: 12,
                }}
                placeholder="Votre téléphone *"
                value={orderContact.phone}
                onChangeText={(text) => setOrderContact(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
              />

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  backgroundColor: '#F9FAFB',
                  marginBottom: 12,
                }}
                placeholder="Votre adresse de livraison"
                value={orderContact.address}
                onChangeText={(text) => setOrderContact(prev => ({ ...prev, address: text }))}
              />

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  backgroundColor: '#F9FAFB',
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Notes ou instructions spéciales"
                value={orderContact.notes}
                onChangeText={(text) => setOrderContact(prev => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Total */}
            <View style={{
              backgroundColor: '#E0F2FE',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#0369A1',
                }}>
                  Total à payer
                </Text>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#10B981',
                }}>
                  {formatPrice(parseInt(product.price) * quantity)} FCFA
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#10B981',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: 20,
              }}
              onPress={submitOrder}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
              }}>
                Confirmer la commande
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal de contact direct */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        transparent
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 350,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#374151',
              textAlign: 'center',
              marginBottom: 16,
            }}>
              Contacter le vendeur
            </Text>

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#E0F2FE',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}>
                <Ionicons name="person" size={30} color="#0369A1" />
              </View>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 4,
              }}>
                {product.seller}
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#6B7280',
              }}>
                {product.contact}
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              marginBottom: 16,
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#10B981',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  minWidth: 80,
                }}
                onPress={directContact}
              >
                <Ionicons name="call" size={20} color="white" />
                <Text style={{ color: 'white', fontSize: 12, marginTop: 4 }}>
                  Appeler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#22C55E',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  minWidth: 80,
                }}
                onPress={directContact}
              >
                <Ionicons name="logo-whatsapp" size={20} color="white" />
                <Text style={{ color: 'white', fontSize: 12, marginTop: 4 }}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#F3F4F6',
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={() => setShowContactModal(false)}
            >
              <Text style={{ color: '#6B7280', fontSize: 14 }}>
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}