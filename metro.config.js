const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.platforms = ['ios', 'android', 'native', 'web'];

config.resolver.alias = {
  '@frontend': path.resolve(__dirname, 'frontend'),
  '@backend': path.resolve(__dirname, 'backend'),
};

config.watchFolders = [
  path.resolve(__dirname, 'frontend'),
  path.resolve(__dirname, 'backend'),
];

config.projectRoot = __dirname;

module.exports = withNativeWind(config, { input: './frontend/global.css' });