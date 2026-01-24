module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // 👇 THIS WAS MISSING
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};