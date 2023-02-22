const { execSync } = require('child_process')
const packageJson = require('../package.json')
const manifest = require('../static/manifest.json')
const manifest_ff = require('../static_ff/manifest.json')
const { writeJSONSync } = require('fs-extra')

const packageVersion = packageJson.version?.split('.')
const manifestVersion = manifest.version?.split('.')
const manifestFFVersion = manifest_ff.version?.split('.')

function compareVersion(a, b) {
    const [mj1, mn1, pt1] = a.map((n) => (isNaN(Number(n)) ? -1 : Number(n)))
    const [mj2, mn2, pt2] = b.map((n) => (isNaN(Number(n)) ? -1 : Number(n)))
    if (mj1 !== mj2) return mj1 > mj2 ? -1 : 1
    if (mn1 !== mn2) return mn1 > mn2 ? -1 : 1
    if (pt1 !== pt2) return pt1 > pt2 ? -1 : 1
    return 0
}
let version = packageVersion
if (
    packageVersion.join('.') !== manifestVersion.join('.') ||
    packageVersion.join('.') !== manifestFFVersion.join('.')
) {
    const sortedVersions = [packageVersion, manifestVersion, manifestFFVersion].sort(compareVersion)
    version = sortedVersions[0]
}
let newVersion = `${version[0]}.${Number(version[1]) + 1}.0`
if (process.argv[2] === 'patch') {
    newVersion = `${version[0]}.${version[1]}.${Number(version[2]) + 1}`
}
else if (process.argv[2] === 'major') {
    newVersion = `${Number(version[0]) + 1}.0.0`
}

packageJson.version = newVersion
manifest.version = newVersion
manifest_ff.version = newVersion

writeJSONSync('./package.json', packageJson, { spaces: 4 })
writeJSONSync('./static/manifest.json', manifest, { spaces: 4 })
writeJSONSync('./static_ff/manifest.json', manifest_ff, { spaces: 4 })

execSync(`git commit -am "release/${newVersion}"`)
execSync(`git tag -a "release/${newVersion}" -m "release/${newVersion}"`)
execSync(`git push --follow-tags`)