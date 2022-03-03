const esbuild = require('esbuild')
const fse = require('fs-extra')
const chokidar = require('chokidar')
const alias = require('esbuild-plugin-alias');

async function build () {
    await fse.remove('./dist')

    const build = esbuild.build({
      entryPoints: ['./src/popup.tsx', './src/content-script.ts', './src/sw.ts'],
      outdir: 'dist/',
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
      inject: ['./build/helmet.js'],
      bundle: true,
      minify: true,
      target: 'chrome90',
      plugins: [
        alias({
            "react": require.resolve("../node_modules/preact/compat"),
            "react-dom/test-utils": require.resolve("../node_modules/preact/test-utils"),
            "react-dom": require.resolve("../node_modules/preact/compat"),
            "react/jsx-runtime": require.resolve("../node_modules/preact/jsx-runtime")
        })
      ]
    })
    
    
    const copy = fse.copy('./static', './dist', { overwrite: true })

    return Promise.all([copy, build]).catch(async (e) => {
        console.error(e)
        process.exit(1)
    })
}

build()