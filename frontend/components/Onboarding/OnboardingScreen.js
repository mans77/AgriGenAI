// import React, { useRef } from 'react';
// import { View, Text, Image, StyleSheet, Dimensions, Button } from 'react-native';
// import Carousel from 'react-native-snap-carousel';
// import { useNavigation } from '@react-navigation/native';

// const { width } = Dimensions.get('window');

// const slides = [
//   {
//     id: '1',
//     title: 'Bienvenue!',
//     description: 'Découvrez notre application et ses fonctionnalités.',
//     image: require('../../assets/image1.png'),
//   },
//   {
//     id: '2',
//     title: 'Suivi en temps réel',
//     description: 'Gardez un œil sur vos activités en direct.',
//     image: require('../../assets/image2.png'),
//   },
//   {
//     id: '3',
//     title: 'Améliorez votre productivité',
//     description: 'Utilisez nos outils pour optimiser vos tâches.',
//     image: require('../../assets/image3.png'),
//   },
// ];

// const OnboardingScreen = () => {
//   const carouselRef = useRef(null);
//   const navigation = useNavigation();

//   const renderItem = ({ item, index }) => (
//     <View style={styles.slide}>
//       <Image source={item.image} style={styles.image} />
//       <Text style={styles.title}>{item.title}</Text>
//       <Text style={styles.description}>{item.description}</Text>
//       {index === slides.length - 1 && (
//         <Button title="Commencer" onPress={() => navigation.navigate('Home')} />
//       )}
//     </View>
//   );

//   return (
//     <Carousel
//       ref={carouselRef}
//       data={slides}
//       renderItem={renderItem}
//       sliderWidth={width}
//       itemWidth={width}
//       loop={false}
//     />
//   );
// };

// const styles = StyleSheet.create({
//   slide: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   image: {
//     width: 200,
//     height: 200,
//     resizeMode: 'contain',
//     marginBottom: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   description: {
//     fontSize: 16,
//     textAlign: 'center',
//     color: '#666',
//   },
// });

// export default OnboardingScreen;
