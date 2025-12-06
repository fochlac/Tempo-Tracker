import { defineConfig } from 'cypress'
import { createEsbuildDevServer } from 'cypress-devserver-esbuild'
import alias from 'esbuild-plugin-alias'

export default defineConfig({
    e2e: {},
    component: {
        devServer: createEsbuildDevServer({
            logLevel: 'info',
            outdir: 'dist-cypress/',
            bundle: true,
            sourcemap: true,
            target: 'chrome90',
            jsxFactory: 'h',
            jsxFragment: 'Fragment',
            inject: ['./build/helmet.js'],
            plugins: [
                alias({
                    react: require.resolve('./node_modules/preact/compat'),
                    'react-dom/test-utils': require.resolve('./node_modules/preact/test-utils'),
                    'react-dom': require.resolve('./node_modules/preact/compat'),
                    'react-dom/client': require.resolve('./node_modules/preact/compat/client'),
                    'react/jsx-runtime': require.resolve('./node_modules/preact/jsx-runtime')
                })
            ]
        }),
        supportFile: './cypress/support/component.tsx',
        specPattern: './cypress/component/**/*.spec.tsx'
    },
    'chromeWebSecurity': false,
    video: false
})
