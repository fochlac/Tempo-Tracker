import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import cypressPlugin from 'eslint-plugin-cypress'
import chaiFriendlyPlugin from 'eslint-plugin-chai-friendly'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
    // Global ignores
    {
        ignores: ['webpack.config.*', 'dist/**', 'dist_ff/**', 'node_modules/**']
    },

    // Base configuration for all files
    {
        files: ['**/*.{js,mjs,cjs,ts,tsx}'],
        languageOptions: {
            ecmaVersion: 12,
            sourceType: 'module',
            parser: tsparser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                    experimentalObjectRestSpread: true
                }
            },
            globals: {
                ...globals.es6,
                isFirefox: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            cypress: cypressPlugin,
            'chai-friendly': chaiFriendlyPlugin,
            react: react,
            'react-hooks': reactHooks
        },
        settings: {
            react: {
                pragma: 'h',
                version: '16.0'
            }
        },
        rules: {
            // ESLint recommended rules
            ...js.configs.recommended.rules,

            // TypeScript ESLint recommended rules
            ...tseslint.configs.recommended.rules,

            // Disable base rule and use TypeScript version
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'error',

            // Custom rules from original config
            'no-case-declarations': 0,
            'no-fallthrough': 0,
            'declaration-block-trailing-semicolon': 0,
            'accessor-pairs': 2,
            'arrow-parens': [2, 'always'],
            'arrow-spacing': [2, { before: true, after: true }],
            'block-spacing': [2, 'always'],
            'comma-dangle': [2, 'never'],
            'comma-spacing': [2, { before: false, after: true }],
            'comma-style': [2, 'last'],
            'constructor-super': 2,
            'curly': [2, 'multi-line'],
            'dot-location': [2, 'property'],
            'eol-last': 2,
            'eqeqeq': [2, 'allow-null'],
            'generator-star-spacing': [2, { before: true, after: true }],

            // Replaced deprecated rules
            'no-global-assign': 2, // was no-native-reassign
            'no-unsafe-negation': 2, // was no-negated-in-lhs
            // handle-callback-err was deprecated, removed (not needed in modern code)

            'indent': [2, 4],
            'key-spacing': [2, { beforeColon: false, afterColon: true }],
            'keyword-spacing': [2, { before: true, after: true }],
            'max-len': [2, { code: 180, tabWidth: 4, ignoreUrls: true, ignorePattern: '^import.*' }],
            'max-lines': [2, { max: 300, skipBlankLines: true, skipComments: true }],
            'max-nested-callbacks': [1, 5],
            'max-params': [1, 5],
            'max-statements-per-line': [1, { max: 1 }],
            'new-cap': [2, { newIsCap: true, capIsNew: false }],
            'new-parens': 2,
            'no-array-constructor': 2,
            'no-caller': 2,
            'no-class-assign': 2,
            'no-cond-assign': 2,
            'no-const-assign': 2,
            'no-control-regex': 2,
            'no-debugger': 2,
            'no-delete-var': 2,
            'no-dupe-args': 2,
            'no-dupe-class-members': 2,
            'no-dupe-keys': 2,
            'no-duplicate-case': 2,
            'no-empty-character-class': 2,
            'no-empty-pattern': 2,
            'no-eval': 2,
            'no-ex-assign': 2,
            'no-extend-native': 2,
            'no-extra-bind': 2,
            'no-extra-parens': [2, 'functions'],
            'no-floating-decimal': 2,
            'no-func-assign': 2,
            'no-implied-eval': 2,
            'no-inner-declarations': [2, 'functions'],
            'no-invalid-regexp': 2,
            'no-irregular-whitespace': 2,
            'no-iterator': 2,
            'no-label-var': 2,
            'no-labels': [2, { allowLoop: false, allowSwitch: false }],
            'no-lone-blocks': 2,
            'no-mixed-spaces-and-tabs': 2,
            'no-multi-spaces': 2,
            'no-multi-str': 2,
            'no-multiple-empty-lines': [2, { max: 1 }],
            'no-nested-ternary': 2,
            'no-new': 2,
            'no-new-func': 2,
            'no-new-object': 2,
            'no-new-require': 2,
            'no-new-symbol': 2,
            'no-new-wrappers': 2,
            'no-obj-calls': 2,
            'no-octal': 2,
            'no-octal-escape': 2,
            'no-path-concat': 2,
            'no-proto': 2,
            'no-redeclare': 2,
            'no-regex-spaces': 2,
            'no-return-assign': [2, 'except-parens'],
            'no-self-assign': 2,
            'no-self-compare': 2,
            'no-sequences': 2,
            'no-shadow-restricted-names': 2,
            'no-spaced-func': 2,
            'no-sparse-arrays': 2,
            'no-this-before-super': 2,
            'no-throw-literal': 0,
            'no-trailing-spaces': 2,
            'no-undef': 0,
            'no-undef-init': 2,
            'no-unexpected-multiline': 2,
            'no-unneeded-ternary': [2, { defaultAssignment: false }],
            'no-unreachable': 2,
            'no-useless-call': 2,
            'no-useless-constructor': 2,
            'no-var': 2,
            'no-with': 2,
            'one-var': [2, { initialized: 'never' }],
            'operator-linebreak': [2, 'after', { overrides: { '?': 'before', ':': 'before' } }],
            'padded-blocks': [2, 'never'],
            'prefer-const': [2],
            'quotes': [2, 'single'],
            'semi': [2, 'never'],
            'semi-spacing': [2, { before: false, after: true }],
            'space-before-blocks': [2, 'always'],
            'space-in-parens': [2, 'never'],
            'space-infix-ops': 2,
            'space-unary-ops': [2, { words: true, nonwords: false }],
            'spaced-comment': [2, 'always', { markers: ['global', 'globals', 'eslint', 'eslint-disable', '*package', '!', ','] }],
            'template-curly-spacing': [2, 'never'],
            'use-isnan': 2,
            'valid-typeof': 2,
            'wrap-iife': [2, 'any'],
            'yield-star-spacing': [2, 'both'],
            'yoda': [2, 'never'],

            // Prettier config rules (disable conflicting formatting rules)
            ...prettierConfig.rules,

            // Preact / JSX rules
            'react/no-deprecated': 2,
            'react/react-in-jsx-scope': 0,
            'react/display-name': [1, { ignoreTranspilerName: false }],
            'react/jsx-no-bind': [1, {
                ignoreRefs: true,
                allowFunctions: true,
                allowArrowFunctions: true
            }],
            'react/jsx-no-comment-textnodes': 2,
            'react/jsx-no-duplicate-props': 2,
            'react/jsx-no-target-blank': 2,
            'react/jsx-no-undef': 2,
            'react/jsx-uses-react': 2,
            'react/jsx-uses-vars': 2,
            'react/jsx-key': [2, { checkFragmentShorthand: true }],
            'react/self-closing-comp': 2,
            'react/prefer-es6-class': 2,
            'react/prefer-stateless-function': 1,
            'react/require-render-return': 2,
            'react/no-danger': 1,
            'react/no-did-mount-set-state': 2,
            'react/no-did-update-set-state': 2,
            'react/no-find-dom-node': 2,
            'react/no-is-mounted': 2,
            'react/no-string-refs': 2,

            // React Hooks rules
            'react-hooks/rules-of-hooks': 2,
            'react-hooks/exhaustive-deps': 1
        }
    },

    // Browser environment for src files
    {
        files: ['src/**/*'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.webextensions
            }
        }
    },

    // Node environment for test-server files
    {
        files: ['test-server/**/*'],
        languageOptions: {
            globals: {
                ...globals.node
            }
        },
        rules: {
            '@typescript-eslint/no-var-requires': 0
        }
    },

    // Cypress test files
    {
        files: ['cypress/**/*'],
        rules: {
            'jest/expect-expect': 0,
            'max-lines': 0,
            'cypress/no-unnecessary-waiting': 0
        }
    }
]
