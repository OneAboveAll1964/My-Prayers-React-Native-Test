const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const localPackagePath = path.resolve(__dirname, '../react-native-prayer-times');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [localPackagePath],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(localPackagePath, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
