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
        inject: ['./build/helmet.js', './build/helmet_chrome.js'],
    })
    const build = esbuild.build({
      ...defaultOptions,
        entryPoints: ['./src/content-script.ts', './src/sw.ts'],
        inject: ['./build/helmet_chrome.js']
    })
    const build_jsx_ff = esbuild.build({
      ...defaultOptions,
      ...jsxOptions,
        entryPoints: ['./src/popup.tsx', './src/content-script.ts', './src/sw.ts'],
        outdir: 'dist_ff/',
        inject: ['./build/helmet.js', './build/helmet_ff.js'],
        target: 'firefox90'
    })
    const build_ff = esbuild.build({
      ...defaultOptions,
        entryPoints: ['./src/content-script.ts', './src/sw.ts'],
        outdir: 'dist_ff/',
        inject: ['./build/helmet_ff.js'],
        target: 'firefox90'
    })

    const copy = fse.copy('./static', './dist', { overwrite: true })
    const copy_ff = copy.then(() => fse.copy('./static_ff', './dist_ff', { overwrite: true }))

    return Promise.all([copy, copy_ff, build, build_jsx, build_jsx_ff, build_ff]).catch(async (e) => {
        console.error(e)
        process.exit(1)
    })
}

build()
