import { defineConfig } from "cypress";
import {createEsbuildDevServer} from 'cypress-devserver-esbuild'
import * as alias from "esbuild-plugin-alias";

export default defineConfig({
  e2e: {},
  component: {
    devServer: createEsbuildDevServer({
        logLevel: 'info',
        outdir: 'dist/',
        bundle: true,
        sourcemap: true,
        target: 'chrome90',
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
        inject: ['./build/helmet.js'],
        plugins: [
          /* @ts-ignore-next-line */
          alias({
                react: require.resolve('./node_modules/preact/compat'),
                'react-dom/test-utils': require.resolve('./node_modules/preact/test-utils'),
                'react-dom': require.resolve('./node_modules/preact/compat'),
                'react/jsx-runtime': require.resolve('./node_modules/preact/jsx-runtime')
            })
        ]
    }),
    supportFile: './cypress/support/component.tsx',
    specPattern: './cypress/component/**/*.spec.tsx'
  },
  video: false
});
