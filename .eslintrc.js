module.exports = {
    parser: "babel-eslint",
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

    extends: [
        "eslint:recommended",
        "plugin:import/errors",
        "plugin:jest/recommended",
        "plugin:promise/recommended",
        "plugin:react/recommended",
    ],

    rules: {
        'no-prototype-builtins': 'off',
        'no-unused-vars': [ 'error', { ignoreRestSiblings: true } ],
        'react/prop-types': 'off',
        'jest/no-test-callback': 'off',
        'jest/no-try-expect': 'off',
    }
};
