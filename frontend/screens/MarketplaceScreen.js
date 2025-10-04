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
  RefreshControl,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

export default function MarketplaceScreen() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // État pour l'ajout de produit
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Matériels agricoles',
    condition: 'Neuf',
    location: 'Diourbel, Sénégal',
    contact: '',
    images: []
  });

  // Catégories de produits
  const categories = [
    { id: 'Tous', name: 'Tous', icon: 'apps-outline' },
    { id: 'Matériels agricoles', name: 'Matériels', icon: 'construct-outline' },
    { id: 'Pesticides et semences', name: 'Pesticides', icon: 'leaf-outline' },
    { id: 'Fruits et légumes', name: 'Fruits', icon: 'nutrition-outline' },
    { id: 'Engrais', name: 'Engrais', icon: 'flask-outline' }
  ];

  // Produits de démonstration
  const demoProducts = [
    {
      id: 1,
      name: 'Arrosoir 10L',
      price: '15000',
      description: 'Arrosoir en plastique robuste, idéal pour l\'arrosage des petites parcelles',
      category: 'Matériels agricoles',
      condition: 'Neuf',
      location: 'Dakar, Sénégal',
      contact: '+221 77 123 45 67',
      seller: 'Amadou Ba',
      images: ['https://via.placeholder.com/300x200/10B981/ffffff?text=Arrosoir'],
      timestamp: '2024-01-15T10:30:00Z',
      featured: true
    },
    {
      id: 2,
      name: 'Bêche professionnelle',
      price: '8500',
      description: 'Bêche en acier inoxydable avec manche en bois, très résistante',
      category: 'Matériels agricoles',
      condition: 'Neuf',
      location: 'Thiès, Sénégal',
      contact: '+221 70 987 65 43',
      seller: 'Fatou Diop',
      images: ['https://via.placeholder.com/300x200/059669/ffffff?text=Bêche'],
      timestamp: '2024-01-14T15:45:00Z'
    },
    {
      id: 3,
      name: 'Serfouette multi-usage',
      price: '6000',
      description: 'Outil polyvalent pour biner, sarcler et butter',
      category: 'Matériels agricoles',
      condition: 'Occasion',
      location: 'Kaolack, Sénégal',
      contact: '+221 76 456 78 90',
      seller: 'Moussa Seck',
      images: ['https://via.placeholder.com/300x200/0369a1/ffffff?text=Serfouette'],
      timestamp: '2024-01-13T09:20:00Z'
    },
    {
      id: 4,
      name: 'Insecticide bio 1L',
      price: '12000',
      description: 'Insecticide à base de neem, efficace contre les pucerons et chenilles',
      category: 'Pesticides et semences',
      condition: 'Neuf',
      location: 'Saint-Louis, Sénégal',
      contact: '+221 78 234 56 78',
      seller: 'Aïsha Ndiaye',
      images: ['https://via.placeholder.com/300x200/059669/ffffff?text=Insecticide'],
      timestamp: '2024-01-12T14:15:00Z'
    },
    {
      id: 5,
      name: 'Graines de tomate hybride',
      price: '5000',
      description: 'Sachet de 100 graines de tomate résistante aux maladies',
      category: 'Pesticides et semences',
      condition: 'Neuf',
      location: 'Ziguinchor, Sénégal',
      contact: '+221 77 345 67 89',
      seller: 'Ousmane Fall',
      images: ['https://via.placeholder.com/300x200/dc2626/ffffff?text=Graines'],
      timestamp: '2024-01-11T16:30:00Z'
    },
    {
      id: 6,
      name: 'Tomates fraîches 5kg',
      price: '3500',
      description: 'Tomates fraîches de la récolte du jour, variété Roma',
      category: 'Fruits et légumes',
      condition: 'Neuf',
      location: 'Diourbel, Sénégal',
      contact: '+221 70 123 98 76',
      seller: 'Mariama Sarr',
      images: ['https://via.placeholder.com/300x200/dc2626/ffffff?text=Tomates'],
      timestamp: '2024-01-10T08:00:00Z'
    },
    {
      id: 7,
      name: 'Carottes biologiques 3kg',
      price: '2500',
      description: 'Carottes cultivées sans pesticides, très sucrées',
      category: 'Fruits et légumes',
      condition: 'Neuf',
      location: 'Louga, Sénégal',
      contact: '+221 76 789 12 34',
      seller: 'Ibrahima Diallo',
      images: ['https://via.placeholder.com/300x200/f97316/ffffff?text=Carottes'],
      timestamp: '2024-01-09T11:45:00Z'
    },
    {
      id: 8,
      name: 'Salade verte 2kg',
      price: '2000',
      description: 'Salade fraîche cultivée en hydroponie',
      category: 'Fruits et légumes',
      condition: 'Neuf',
      location: 'Tambacounda, Sénégal',
      contact: '+221 77 567 89 01',
      seller: 'Khadija Mbaye',
      images: ['https://via.placeholder.com/300x200/059669/ffffff?text=Salade'],
      timestamp: '2024-01-08T07:20:00Z'
    }
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setIsLoading(true);
    setTimeout(() => {
      setProducts(demoProducts);
      setIsLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Tous' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addProductImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à vos photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled) {
        setNewProduct(prev => ({
          ...prev,
          images: [...prev.images, result.assets[0]]
        }));
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la sélection de l\'image');
    }
  };

  const takeProductPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à votre caméra.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setNewProduct(prev => ({
          ...prev,
          images: [...prev.images, result.assets[0]]
        }));
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la prise de photo');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une source',
      [
        { text: 'Galerie', onPress: addProductImage },
        { text: 'Appareil photo', onPress: takeProductPhoto },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const submitProduct = () => {
    if (!newProduct.name.trim() || !newProduct.price.trim() || !newProduct.contact.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (newProduct.images.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins une photo du produit');
      return;
    }

    const productToAdd = {
      id: Date.now(),
      ...newProduct,
      seller: 'Vous',
      timestamp: new Date().toISOString(),
    };

    setProducts(prev => [productToAdd, ...prev]);
    setShowAddModal(false);
    setNewProduct({
      name: '',
      price: '',
      description: '',
      category: 'Matériels agricoles',
      condition: 'Neuf',
      location: 'Diourbel, Sénégal',
      contact: '',
      images: []
    });

    Alert.alert('Succès', 'Votre produit a été ajouté avec succès !');
  };

  const contactSeller = (product) => {
    Alert.alert(
      'Contacter le vendeur',
      `${product.seller}\nTéléphone: ${product.contact}\nProduit: ${product.name}`,
      [
        { text: 'Appeler', onPress: () => Alert.alert('Info', 'Fonction d\'appel à implémenter') },
        { text: 'Message', onPress: () => Alert.alert('Info', 'Fonction de message à implémenter') },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  const viewProductDetails = (product) => {
    navigation.navigate('ProductDetails', { product });
  };

  const renderProductCard = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        margin: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flex: 1,
      }}
      onPress={() => viewProductDetails(item)}
    >
      {/* Badge Featured */}
      {item.featured && (
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: '#F59E0B',
          borderRadius: 12,
          paddingHorizontal: 8,
          paddingVertical: 4,
          zIndex: 1,
        }}>
          <Text style={{
            color: 'white',
            fontSize: 10,
            fontWeight: '600',
          }}>
            VEDETTE
          </Text>
        </View>
      )}

      {/* Image du produit */}
      <Image
        source={{ uri: item.images[0] }}
        style={{
          width: '100%',
          height: 120,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
        resizeMode="cover"
      />

      <View style={{ padding: 12 }}>
        {/* Nom et prix */}
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: '#374151',
          marginBottom: 4,
        }} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#10B981',
          marginBottom: 6,
        }}>
          {parseInt(item.price).toLocaleString()} FCFA
        </Text>

        {/* Description */}
        <Text style={{
          fontSize: 12,
          color: '#6B7280',
          marginBottom: 8,
          lineHeight: 16,
        }} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Localisation et condition */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}>
          <Ionicons name="location-outline" size={12} color="#6B7280" />
          <Text style={{
            fontSize: 10,
            color: '#6B7280',
            marginLeft: 4,
            flex: 1,
          }} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        {/* Badge condition */}
        <View style={{
          backgroundColor: item.condition === 'Neuf' ? '#E0F2FE' : '#FEF3C7',
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 8,
          alignSelf: 'flex-start',
          marginBottom: 8,
        }}>
          <Text style={{
            fontSize: 10,
            color: item.condition === 'Neuf' ? '#0369A1' : '#92400E',
            fontWeight: '600',
          }}>
            {item.condition}
          </Text>
        </View>

        {/* Bouton contact */}
        <TouchableOpacity
          style={{
            backgroundColor: '#10B981',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => contactSeller(item)}
        >
          <Ionicons name="call-outline" size={14} color="white" />
          <Text style={{
            color: 'white',
            fontSize: 12,
            fontWeight: '600',
            marginLeft: 4,
          }}>
            Contacter
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
          BOUTIQUE
        </Text>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)}
          style={{ padding: 4 }}
        >
          <Ionicons name="add-circle" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={{
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 14,
              color: '#374151',
            }}
            placeholder="Rechercher un produit..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Catégories - Version corrigée avec hauteur appropriée */}
      <View style={{
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 16, // Augmenté de 12 à 16
        minHeight: 60, // Hauteur minimum garantie
      }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            alignItems: 'center', // Centrer verticalement
            minHeight: 44, // Hauteur minimum pour le contenu
          }}
          style={{
            flexGrow: 0, // Empêcher la croissance excessive
          }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={{
                backgroundColor: selectedCategory === category.id ? '#10B981' : '#F3F4F6',
                paddingHorizontal: 20, // Augmenté de 16 à 20
                paddingVertical: 12, // Augmenté de 8 à 12
                borderRadius: 25, // Augmenté pour un meilleur look
                marginRight: 12, // Augmenté de 8 à 12
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44, // Hauteur minimum pour chaque bouton
                minWidth: 80, // Largeur minimum
                // Ombre pour plus de visibilité
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: selectedCategory === category.id ? 0.2 : 0.1,
                shadowRadius: 2,
                elevation: selectedCategory === category.id ? 3 : 1,
                // Bordure pour plus de définition
                borderWidth: selectedCategory === category.id ? 0 : 1,
                borderColor: '#E5E7EB',
              }}
              onPress={() => setSelectedCategory(category.id)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={category.icon} 
                size={18} // Augmenté de 16 à 18
                color={selectedCategory === category.id ? 'white' : '#6B7280'} 
                style={{ marginRight: 6 }} // Espacement fixe
              />
              <Text style={{
                color: selectedCategory === category.id ? 'white' : '#374151',
                fontWeight: '600',
                fontSize: 13, // Augmenté de 12 à 13
                lineHeight: 16, // Hauteur de ligne définie
              }}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Indicateur de scroll pour les catégories */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 8,
        }}>
          <View style={{
            width: 30,
            height: 3,
            backgroundColor: '#E5E7EB',
            borderRadius: 1.5,
          }} />
        </View>
      </View>

      {/* Liste des produits */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 40,
          }}>
            <Ionicons name="storefront-outline" size={64} color="#D1D5DB" />
            <Text style={{
              fontSize: 16,
              color: '#6B7280',
              marginTop: 16,
              textAlign: 'center',
            }}>
              {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit dans cette catégorie'}
            </Text>
          </View>
        )}
      />

      {/* Modal d'ajout de produit */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
          {/* Header Modal */}
          <View style={{
            backgroundColor: 'white',
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color="#10B981" />
            </TouchableOpacity>
            <Text style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '600',
              color: '#10B981',
            }}>
              Ajouter un produit
            </Text>
            <TouchableOpacity onPress={submitProduct}>
              <Ionicons name="checkmark" size={24} color="#10B981" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }}>
            {/* Nom du produit */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}>
                Nom du produit *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  backgroundColor: 'white',
                }}
                placeholder="Ex: Arrosoir 10L"
                value={newProduct.name}
                onChangeText={(text) => setNewProduct(prev => ({ ...prev, name: text }))}
              />
            </View>

            {/* Prix */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}>
                Prix (FCFA) *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  backgroundColor: 'white',
                }}
                placeholder="Ex: 15000"
                value={newProduct.price}
                onChangeText={(text) => setNewProduct(prev => ({ ...prev, price: text }))}
                keyboardType="numeric"
              />
            </View>

            {/* Description */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}>
                Description
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  backgroundColor: 'white',
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="Décrivez votre produit..."
                multiline
                numberOfLines={4}
                value={newProduct.description}
                onChangeText={(text) => setNewProduct(prev => ({ ...prev, description: text }))}
              />
            </View>

            {/* Catégorie dans le modal - Version améliorée */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 12, // Augmenté de 8 à 12
              }}>
                Catégorie
              </Text>
              <View style={{
                minHeight: 50, // Hauteur minimum pour le conteneur
                paddingVertical: 4,
              }}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    alignItems: 'center',
                    paddingVertical: 4,
                  }}
                >
                  {categories.filter(cat => cat.id !== 'Tous').map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={{
                        backgroundColor: newProduct.category === category.id ? '#10B981' : '#F3F4F6',
                        paddingHorizontal: 18, // Augmenté
                        paddingVertical: 10, // Augmenté
                        borderRadius: 22, // Augmenté
                        marginRight: 10, // Augmenté
                        minHeight: 40, // Hauteur minimum
                        justifyContent: 'center',
                        alignItems: 'center',
                        // Ombre pour le modal aussi
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                        borderWidth: newProduct.category === category.id ? 0 : 1,
                        borderColor: '#E5E7EB',
                      }}
                      onPress={() => setNewProduct(prev => ({ ...prev, category: category.id }))}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons 
                          name={category.icon} 
                          size={16} 
                          color={newProduct.category === category.id ? 'white' : '#6B7280'}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={{
                          color: newProduct.category === category.id ? 'white' : '#374151',
                          fontSize: 13, // Augmenté
                          fontWeight: '600',
                          lineHeight: 16,
                        }}>
                          {category.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* État - Version améliorée aussi */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 12,
              }}>
                État
              </Text>
              <View style={{ 
                flexDirection: 'row',
                minHeight: 44, // Hauteur minimum
                alignItems: 'center',
              }}>
                {['Neuf', 'Occasion'].map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={{
                      backgroundColor: newProduct.condition === condition ? '#10B981' : '#F3F4F6',
                      paddingHorizontal: 24, // Augmenté
                      paddingVertical: 12, // Augmenté
                      borderRadius: 22, // Augmenté
                      marginRight: 12, // Augmenté
                      minHeight: 44, // Hauteur minimum
                      justifyContent: 'center',
                      alignItems: 'center',
                      flex: 1, // Utiliser l'espace disponible
                      maxWidth: 120, // Largeur maximum
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                      borderWidth: newProduct.condition === condition ? 0 : 1,
                      borderColor: '#E5E7EB',
                    }}
                    onPress={() => setNewProduct(prev => ({ ...prev, condition }))}
                    activeOpacity={0.8}
                  >
                    <Text style={{
                      color: newProduct.condition === condition ? 'white' : '#374151',
                      fontSize: 14,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}>
                      {condition}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Localisation */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}>
                Localisation
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  backgroundColor: 'white',
                }}
                placeholder="Ex: Dakar, Sénégal"
                value={newProduct.location}
                onChangeText={(text) => setNewProduct(prev => ({ ...prev, location: text }))}
              />
            </View>

            {/* Contact */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}>
                Téléphone *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  backgroundColor: 'white',
                }}
                placeholder="Ex: +221 77 123 45 67"
                value={newProduct.contact}
                onChangeText={(text) => setNewProduct(prev => ({ ...prev, contact: text }))}
                keyboardType="phone-pad"
              />
            </View>

            {/* Photos */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}>
                Photos du produit *
              </Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={{
                    width: 100,
                    height: 100,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: '#D1D5DB',
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                  }}
                  onPress={showImagePicker}
                >
                  <Ionicons name="camera" size={32} color="#6B7280" />
                  <Text style={{
                    fontSize: 10,
                    color: '#6B7280',
                    textAlign: 'center',
                    marginTop: 4,
                  }}>
                    Ajouter une photo
                  </Text>
                </TouchableOpacity>

                {newProduct.images.map((image, index) => (
                  <View key={index} style={{ marginRight: 8 }}>
                    <Image
                      source={{ uri: image.uri }}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 8,
                      }}
                    />
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: '#EF4444',
                        borderRadius: 12,
                        padding: 4,
                      }}
                      onPress={() => setNewProduct(prev => ({
                        ...prev,
                        images: prev.images.filter((_, i) => i !== index)
                      }))}
                    >
                      <Ionicons name="close" size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}