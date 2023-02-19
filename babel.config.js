module.exports = {
  "presets": [
    "@babel/env",
    ["@babel/typescript", { "jsxPragma": "h" }]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-react-jsx",
      {
        "pragma": "h",
        "pragmaFrag": "Fragment"
      }
    ],
    ["babel-plugin-jsx-pragmatic", {
      "module": "preact",
      "import": "h",
      "export": "h"
    }],
    "babel-plugin-styled-components",
    "@babel/plugin-transform-modules-commonjs"
  ]
}