module.exports = {
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaVersion": 6,
        "ecmaFeatures": {
            "classes": true,
            "experimentalObjectRestSpread": true,
            "jsx": true,
            "modules": true
        },
        "sourceType": "module"
    },

    "settings": {
        "react": {
           "version": "detect"
        }
    },

    "env": {
        "browser": true,
        "es6": true,
        "jest/globals": true,
        "node": true
    },

    "plugins": [
        "import",
        "jest",
        "promise",
        "react",
        "react-hooks",
    ],

    "extends": [
        "eslint:recommended",
        "plugin:import/errors",
        "plugin:jest/recommended",
        "plugin:promise/recommended",
        "plugin:react/all",
    ],

    "rules": {

        // Possible Errors
        "no-console": 0,
        "no-extra-parens": [
            "error",
            "all",
            {
                "nestedBinaryExpressions": false,
                "ignoreJSX": "all",
                "returnAssign": false
            }
        ],

        // Best Practices
        "accessor-pairs": ["error", {"getWithoutSet": true}],
        "block-scoped-var": "error",
        "consistent-return": "error",
        "no-alert": "error",
        "no-div-regex": "off",
        "no-else-return": "off",
        "no-eval": "error",
        "no-extend-native": "error",
        "no-extra-bind": "error",
        "no-floating-decimal": "error",
        "no-implicit-coercion": "off",
        "no-implicit-globals": "error",
        "no-implied-eval": "error",
        "no-iterator": "error",
        "no-labels": ["error", {"allowSwitch": true}],
        "no-lone-blocks": "error",
        "no-loop-func": "error",
        "no-multi-spaces": "off",
        "no-multi-str": "error",
        "no-new": "error",
        "no-new-func": "error",
        "no-new-wrappers": "error",
        "no-octal-escape": "error",
        "no-proto": "error",
        "no-return-assign": "error",
        "no-return-await": "error",
        "no-self-compare": "error",
        "no-sequences": "error",
        "no-throw-literal": "error",
        "no-unused-expressions": "error",
        "no-unused-vars": ["error", { "ignoreRestSiblings": true }],
        "no-useless-call": "error",
        "no-useless-concat": "error",
        "no-useless-return": "error",
        "no-void": "error",
        "no-with": "error",
        "radix": "error",
        "require-await": "error",
        "semi": ["error", "always"],
        "wrap-iife": "error",

        // Variables
        "no-catch-shadow": "error",
        "no-label-var": "error",
        "no-shadow": "error",
        "no-shadow-restricted-names": "error",
        "no-undef-init": "error",
        "no-use-before-define": "error",

        // Promises
        "promise/avoid-new": "off",
        "promise/always-return": "off",

        // Node.js
        "handle-callback-err": "error",
        "no-mixed-requires": "error",
        "no-new-require": "error",
        "no-path-concat": "error",
        "no-process-exit": "error",

        // Jest
        // It is very important not to allow tests to be disabled. This can happen
        // easily during development, and this rule ensures that temporarily disabled
        // tests are not going to stay disabled in production.
        "jest/no-disabled-tests": "error",

        // ECMAScript
        "arrow-body-style": ["error", "as-needed"],
        "arrow-parens": ["error", "as-needed"],
        "arrow-spacing": "error",
        "no-duplicate-imports": "error",
        "no-useless-computed-key": "error",
        "no-useless-constructor": "error",
        "no-useless-rename": "error",
        "no-var": "error",
        "prefer-const": "off",
        "prefer-template": "off",
        "no-prototype-builtins": "off",

        // React
        //
        // all react rules are on by default; turn off the ones we don't want
        "react/destructuring-assignment": "off",

        // Do we want this one to be an error instead? Enforces shapes instead of generic any, array, object
        "react/forbid-prop-types": "off",
        "react/no-multi-comp": "off",
        "react/no-set-state": "off",
        "react/jsx-no-literals": "off",

        "react/no-unused-state": "error",
        "react/require-optimization": ["error", { allowDecorators: ["pure"] }],

        // TODO we should not skip undeclared: CA-713
        "react/prop-types": ["error", { skipUndeclared: true }],

        // Avoids performance implications
        "react/jsx-no-bind": ["error", { ignoreRefs: true, allowArrowFunctions: true }],

        // Other stylistic preferences
        "react/jsx-closing-tag-location": "off",
        "react/jsx-curly-spacing": "off",
        "react/jsx-sort-props": "off",
        "react/jsx-max-props-per-line": "off",
        "react/jsx-closing-bracket-location": "off",
        "react/jsx-filename-extension": "off",
        "react/jsx-first-prop-new-line": "off",
        "react/jsx-indent": "off",
        "react/jsx-indent-props": "off",
        "react/jsx-wrap-multilines": "off",
        "react/jsx-one-expression-per-line": "off",
        "react/forbid-component-props": "off",
        "react/prefer-stateless-function": "off",
        "react/forbid-foreign-prop-types": "off",
        "react/no-array-index-key": "off",
        "react/sort-prop-types": "off",
        "react/jsx-sort-default-props": "off",
        "react/display-name": "off",
        "react/sort-comp": "off",
        "react/jsx-props-no-spreading": "off",
        "react/jsx-max-depth": "off",
        "react/jsx-curly-newline": "off",
        "react/jsx-fragments": "off",
        "react/state-in-constructor": "off",
        "react/jsx-no-target-blank": "off",
        "react/static-property-placement": "off",
        "react/prop-types": "off",
        "react/require-default-props": "off",
        "react/default-props-match-prop-types": "off",
        "react/require-optimization": "off",
    }
};
