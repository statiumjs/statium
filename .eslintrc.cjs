module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  env: {
    browser: true,
    es6: true,
    es2017: true,
    jest: true,
    jasmine: true,
    node: true,
  },

  plugins: [
    "import",
    "jest",
    "promise",
    "react",
    "react-hooks",
  ],

  settings: {
    react: {
      version: 'detect',
    },
  },

  globals: {
    globalThis: 'readonly',
    sleep: 'readonly',
    merge: 'readonly',
    bork: 'readonly',
    unbork: 'readonly',
  },

  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:jest/recommended",
    "plugin:promise/recommended",
    "plugin:react/recommended",
  ],

  rules: {
    'no-prototype-builtins': 'off',
    'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    'react/prop-types': 'off',
    'jest/no-test-callback': 'off',
    'jest/no-done-callback': 'off',
    'jest/no-conditional-expect': 'off',
    'jest/no-try-expect': 'off',
    'jest/no-jasmine-globals': 'off',
    'react/no-unescaped-entities': 'off',
  }
};
