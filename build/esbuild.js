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
      watch: true,
      sourcemap: true,
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
    const watcher = chokidar.watch('./static', {
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    })
    copy.then(() => {
      watcher.on('add', (path) => {
          console.log(`New static file: ${path}`)
          fse.copy(path, path.replace('static', 'dist'), { overwrite: true })
        })
        .on('change', (path) => {
          console.log(`Updated static file: ${path}`)
          fse.copy(path, path.replace('static', 'dist'), { overwrite: true })
        })
        .on('unlink', (path) => {
          console.log(`Deleted static file: ${path}`)
          fse.remove(path.replace('static', 'dist'))
        })
    })

    return Promise.all([copy, build]).catch(async (e) => {
        console.error(e)
        await watcher.close()
        process.exit(1)
    })
}

build()