const fs = require('fs')
const path = require('path')
const zip = require('zip-a-folder').zip

function copyFileSync (source, target) {
    let targetFile = target

    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source))
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source))
}

function copyFolderSync (source, target, recursive = true, initial = true) {
    let files = []

    // Check if folder needs to be created or integrated
    const targetFolder = initial ? target : path.join(target, path.basename(source))
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder)
    }

    // Copy
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source)
        files.forEach((file) => {
            const curSource = path.join(source, file)
            if (fs.lstatSync(curSource).isDirectory()) {
                if (!recursive) {
                    return
                }
                copyFolderSync(curSource, targetFolder, recursive, false)
            }
            else {
                copyFileSync(curSource, targetFolder)
            }
        })
    }
}

function zipFiles () {
    return Promise.all([
        zip('./extension_firefox_source', './extension_firefox_source.zip')
            .then(() => console.log('Successfully packaged Firefox-Extension-Source.'))
            .catch((e) => console.log('Error packaging Firefox-Extension-Source:', e)),
        zip('./dist/', './extension_chrome.zip')
            .then(() => console.log('Successfully packaged Chrome-Extension.'))
            .catch((e) => console.log('Error packaging Chrome-Extension: ', e)),
        zip('./dist_ff/', './extension_firefox.zip')
            .then(() => console.log('Successfully packaged Firefox-Extension.'))
            .catch((e) => console.log('Error packaging Firefox-Extension:', e))
    ])
}

fs.existsSync('./extension_chrome.zip') && fs.unlinkSync('./extension_chrome.zip')
fs.existsSync('./extension_firefox_source.zip') && fs.unlinkSync('./extension_firefox_source.zip')
fs.existsSync('./extension_firefox.zip') && fs.unlinkSync('./extension_firefox.zip')

!fs.existsSync('./extension_firefox_source') && fs.mkdirSync('./extension_firefox_source')
!fs.existsSync('./extension_firefox_source/src') && fs.mkdirSync('./extension_firefox_source/src')
!fs.existsSync('./extension_firefox_source/static') && fs.mkdirSync('./extension_firefox_source/static')
!fs.existsSync('./extension_firefox_source/static_ff') && fs.mkdirSync('./extension_firefox_source/static_ff')
!fs.existsSync('./extension_firefox_source/types') && fs.mkdirSync('./extension_firefox_source/types')
copyFolderSync('./', './extension_firefox_source/', false)
copyFolderSync('./src/', './extension_firefox_source/src/')
copyFolderSync('./build/', './extension_firefox_source/build/')
copyFolderSync('./types/', './extension_firefox_source/types/')
copyFolderSync('./static/', './extension_firefox_source/static/')
copyFolderSync('./static_ff/', './extension_firefox_source/static_ff/')

zipFiles()
.then(() => {
    fs.rmSync('./extension_firefox_source', { recursive: true, force: true })
})
