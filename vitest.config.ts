import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
        exclude: ['node_modules', 'dist', 'dist_ff', 'cypress'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                'dist_ff/',
                'cypress/',
                'src/**/*.d.ts',
                'src/**/*.spec.{ts,tsx}',
                'src/**/*.test.{ts,tsx}',
                'src/test-setup.ts'
            ]
        }
    },
    resolve: {
        alias: {
            '^react$': 'preact/compat',
            '^react-dom$': 'preact/compat',
            '^react-dom/test-utils$': 'preact/test-utils',
            '^react/jsx-runtime$': 'preact/jsx-runtime'
        }
    }
})
