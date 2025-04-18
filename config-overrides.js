// config-overrides.js
const path = require('path');

module.exports = function override(config) {
  // Configura los alias
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    },
    // Asegúrate de que Webpack resuelva las extensiones .tsx
    extensions: [...config.resolve.extensions, '.ts', '.tsx'],
  };
  return config;
};