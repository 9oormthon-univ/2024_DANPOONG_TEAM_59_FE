const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve(
      "metro-react-native-babel-transformer"
    ),
  };

  config.resolver = {
    ...resolver,
    sourceExts: [
      ...resolver.sourceExts,
      "cjs",
      "js",
      "jsx",
      "json",
      "ts",
      "tsx",
    ],
  };

  return config;
})();
