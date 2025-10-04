# AgriGenAI

Bienvenue dans le projet **AgriGenAI**, une application qui révolutionne l'agriculture avec l'IA Générative. Ce guide vous accompagne dans l'installation et le démarrage du projet utilisant React Native avec Expo pour l'application mobile et FastAPI pour le back-end.

![Accueil](assets/WhatsApp-Image1.jpeg)


## Pré-requis
Avant de commencer, assurez-vous d'avoir les outils suivants installés sur votre machine :

- **Node.js** (version 18)
- **Yarn**
- **Expo CLI** : `yarn global add expo-cli`
- **Python** (version 3.x) avec **virtualenv**


## Installation et Démarrage

### 1. Configuration du projet React Native

1. **Clonez le dépôt :**
   ```bash
   git clone https://github.com/alphacpc/AgriGenAI.git
   cd AgriGenAI

2. **Installez les dépendances :**
   ```bash
   yarn install
3. **Démarrez le projet :**
   ```bash
   yarn start

4. **Testez sur un appareil mobile :**
   - Téléchargez l'application **Expo Go** depuis le Play Store ou l'App Store.
   - Scannez le QR Code affiché dans votre terminal ou navigateur pour visualiser l'application.

### 2, Configuration et démarrage de l'API FastAPI
1. **Naviguez dans le dossier de l'API :**
   ```bash
   cd api
   
2. **Créez un environnement virtuel :**
   ```bash
   python -m venv env
   source env/bin/activate  # Sous Windows : env\Scripts\activate

3. **Installez les dépendances :**
   ```bash
   pip install -r requirements.txt

4. **Lancez le serveur FastAPI :**
   ```bash
    uvicorn api_test:app --host 0.0.0.0 --port 8000

5. **Accédez à l'API** Votre API est maintenant accessible sur [http://0.0.0.0:8000/]


## Fonctionnalités de l'application

- Diagnostic des plantes grâce à l'IA.
- Accès aux symptômes et traitements recommandés.
  ![Diagnostic des plantes](assets/WhatsApp-Image2.jpeg)

- Intégration des données météo en temps réel.
  ![Intégration des données météo en temps réel](assets/WhatsApp-Image3.jpeg)
