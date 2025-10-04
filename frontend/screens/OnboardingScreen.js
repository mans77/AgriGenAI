import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions, 
  ImageBackground,
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    image: require('../assets/image1.jpeg'),
    title: "Révolutionnez votre agriculture avec l'IA",
    subtitle: "Diagnostic intelligent de vos cultures",
    description: 'Utilisez la puissance de l\'intelligence artificielle pour identifier instantanément les maladies et ravageurs de vos plantes.',
    buttonText: 'Commençons'
  },
  {
    id: '2',
    image: require('../assets/image2.jpeg'),
    title: "Maximisez vos rendements avec l'IA générative",
    subtitle: "Conseils personnalisés et précis",
    description: 'Recevez des recommandations sur mesure pour optimiser vos traitements et améliorer la santé de vos cultures.',
    buttonText: 'Passer'
  },
  {
    id: '3',
    image: require('../assets/image3.jpeg'),
    title: "Exploitez le pouvoir de l'IA pour des récoltes durables",
    subtitle: "Agriculture moderne et durable",
    description: 'Adoptez des pratiques agricoles modernes et durables grâce à nos outils d\'analyse avancés et nos conseils d\'experts.',
    buttonText: 'Terminé'
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      // Navigation vers l'écran d'authentification au lieu de Main
      navigation.navigate('Auth');
    }
  };

  const handleSkip = () => {
    // Navigation vers l'écran d'authentification au lieu de Main
    navigation.navigate('Auth');
  };

  const renderItem = ({ item, index }) => {
    return (
      <View style={[styles.slide, { width, height }]}>
        <ImageBackground 
          source={item.image} 
          style={styles.backgroundImage}
          imageStyle={styles.imageStyle}
        >
          {/* Gradient overlay */}
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0.1)', 
              'rgba(0, 0, 0, 0.3)', 
              'rgba(0, 0, 0, 0.7)'
            ]}
            style={styles.gradient}
            locations={[0, 0.5, 1]}
          >
            {/* Logo AgriGenAI */}
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.logoText}>AgriGenAI</Text>
              </View>
            </View>

            {/* Content Container */}
            <View style={styles.contentContainer}>
              {/* Text Content */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>{item.buttonText}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };

  const renderProgressIndicator = () => {
    return (
      <View style={styles.progressContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              currentIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Passer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.floor(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToAlignment="center"
          snapToInterval={width}
        />

        {renderHeader()}
        {renderProgressIndicator()}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 50,
  },
  logoContainer: {
    alignItems: 'flex-start',
    marginTop: 30,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  logoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  textContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    lineHeight: 34,
    marginBottom: 8,
    textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    textAlign: 'left',
  },
  actionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    flexDirection: 'row',
    zIndex: 10,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginRight: 8,
  },
  activeDot: {
    backgroundColor: '#10B981',
    width: 24,
    borderRadius: 4,
  },
});

export default OnboardingScreen;
