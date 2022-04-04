const esbuild = require('esbuild')
const fse = require('fs-extra')
const alias = require('esbuild-plugin-alias')

const defaultOptions =  {
  outdir: 'dist/',
  bundle: true,
  minify: true,
  target: 'chrome90',
}
const jsxOptions = {
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  inject: ['./build/helmet.js'],
  plugins: [
      alias({
          react: require.resolve('../node_modules/preact/compat'),
          'react-dom/test-utils': require.resolve('../node_modules/preact/test-utils'),
          'react-dom': require.resolve('../node_modules/preact/compat'),
          'react/jsx-runtime': require.resolve('../node_modules/preact/jsx-runtime')
      })
  ]
}

async function build() {
    await fse.remove('./dist')

    const build_jsx = esbuild.build({
        ...defaultOptions,
        ...jsxOptions,
        entryPoints: ['./src/popup.tsx'],
    })
    const build = esbuild.build({
      ...defaultOptions,
        entryPoints: ['./src/content-script.ts', './src/sw.ts']
    })
    const build_jsx_ff = esbuild.build({
      ...defaultOptions,
      ...jsxOptions,
        entryPoints: ['./src/popup.tsx', './src/content-script.ts', './src/sw.ts'],
        outdir: 'dist_ff/',
        target: 'firefox90'
    })
    const build_ff = esbuild.build({
      ...defaultOptions,
        entryPoints: ['./src/content-script.ts', './src/sw.ts'],
        outdir: 'dist_ff/',
        target: 'firefox90'
    })

    const copy = fse.copy('./static', './dist', { overwrite: true })
    const copy_ff = fse.copy('./static', './dist_ff', { overwrite: true })

    return Promise.all([copy, copy_ff, build, build_jsx, build_jsx_ff, build_ff]).catch(async (e) => {
        console.error(e)
        process.exit(1)
    })
}

build()
