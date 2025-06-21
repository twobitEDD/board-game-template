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

      return config;
    }
  )(config, env)
}