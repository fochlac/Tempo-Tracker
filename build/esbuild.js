const esbuild = require('esbuild')
const fse = require('fs-extra')
const chokidar = require('chokidar')
const alias = require('esbuild-plugin-alias')
const defaultOptions = {
    logLevel: 'info',
    outdir: 'dist/',
    bundle: true,
    watch: true,
    sourcemap: true,
    target: 'chrome90'
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
    await fse.remove('./dist_ff')

    const build_jsx = esbuild.build({
        ...defaultOptions,
        ...jsxOptions,
        entryPoints: ['./src/popup.tsx']
    })
    const build = esbuild.build({
        ...defaultOptions,
        entryPoints: ['./src/content-script.ts', './src/sw.ts'],
    })
    const build_jsx_ff = esbuild.build({
        ...defaultOptions,
        ...jsxOptions,
        entryPoints: ['./src/popup.tsx'],
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
    const copy_ff_2 = copy_ff.then(() => fse.copy('./static_ff', './dist_ff', { overwrite: true }))
    const watcher = chokidar.watch('./static', {
        awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100
        }
    })
    const watcher2 = chokidar.watch('./static_ff', {
        awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 100
        }
    })
    Promise.all([copy, copy_ff, copy_ff_2]).then(() => {
        watcher
            .on('add', (path) => {
                console.log(`New static file: ${path}`)
                fse.copy(path, path.replace('static', 'dist'), { overwrite: true })
                fse.copy(path, path.replace('static', 'dist_ff'), { overwrite: true })
            })
            .on('change', (path) => {
                console.log(`Updated static file: ${path}`)
                fse.copy(path, path.replace('static', 'dist'), { overwrite: true })
                if (!path.includes('manifest.json')) {
                    fse.copy(path, path.replace('static', 'dist_ff'), { overwrite: true })
                }
            })
            .on('unlink', (path) => {
                console.log(`Deleted static file: ${path}`)
                fse.remove(path.replace('static', 'dist'))
                fse.remove(path.replace('static', 'dist_ff'))
            })
        watcher2
            .on('change', (path) => {
                console.log(`Updated static file: ${path}`)
                fse.copy(path, path.replace('static_ff', 'dist_ff'), { overwrite: true })
            })
    })

    return Promise.all([copy, copy_ff, build, build_jsx, build_jsx_ff, build_ff, copy_ff_2]).catch(async (e) => {
        console.error(e)
        await watcher.close()
        await watcher2.close()
        process.exit(1)
    })
}

build()
