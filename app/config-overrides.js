const { override, addWebpackPlugin, addWebpackModuleRule } = require('customize-cra')
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin")
const { aliasDangerous, configPaths } = require('react-app-rewire-alias/lib/aliasDangerous')

module.exports = (config, env) => {
  return override(
    addWebpackPlugin(new ImageMinimizerPlugin({
      deleteOriginalAssets: false,
      generator: [
        {
          type: "asset",
          implementation: ImageMinimizerPlugin.imageminGenerate,
          options: {
            plugins: ["imagemin-webp"],
          }
        }
      ]
    })),
    aliasDangerous(configPaths('./tsconfig.paths.json')),
    (config) => {
      // Ignore source map warnings from node_modules
      config.ignoreWarnings = [
        {
          module: /node_modules/,
          message: /Failed to parse source map/,
        },
      ];

      // Alternative: You can also modify the source-map-loader to exclude node_modules
      config.module.rules.forEach((rule) => {
        if (rule.enforce === 'pre' && rule.use) {
          rule.use.forEach((use) => {
            if (use.loader && use.loader.includes('source-map-loader')) {
              use.exclude = /node_modules/;
            }
          });
        }
      });

      // Add webpack fallbacks for problematic imports
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "crypto": false,
        "stream": false,
        "http": false,
        "https": false,
        "zlib": false,
        "url": false
      };

      // Create mock modules for problematic imports
      config.resolve.alias = {
        ...config.resolve.alias,
        "openapi-fetch": require.resolve('./src/mocks/openapi-fetch-mock.js'),
        "@react-native-async-storage/async-storage": require.resolve('./src/mocks/async-storage-mock.js'),
        // Fix jsx-runtime resolution for Dynamic Labs in development
        "react/jsx-runtime": require.resolve('react/jsx-runtime'),
        "react/jsx-dev-runtime": require.resolve('react/jsx-dev-runtime')
      };

      return config;
    }
  )(config, env)
}