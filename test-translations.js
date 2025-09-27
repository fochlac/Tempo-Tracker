/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const path = require('path')

console.log('🔍 Running final verification of translation system...\n')

// Read the updated en.json file
const enJsonPath = path.join(__dirname, 'src', 'translations', 'en.json')
const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf8'))

console.log(`📊 Total translation keys in en.json: ${Object.keys(enJson).length}\n`)

// Find all t('key') patterns in src folder
const glob = require('glob')

function findTranslationCalls(directory) {
    const files = glob.sync(`${directory}/**/*.{ts,tsx}`, { ignore: ['**/node_modules/**'] })
    const translationCalls = new Set()

    files.forEach((file) => {
        const content = fs.readFileSync(file, 'utf8')
        const matches = content.matchAll(/\Wt\(['"]([\w.]+)['"]/g)
        for (const match of matches) {
            translationCalls.add(match[1])
        }
    })

    return Array.from(translationCalls)
}

const translationCalls = findTranslationCalls('src')
console.log(`🔍 Found ${translationCalls.length} t('key') calls in src folder`)

// Check which translation keys are used
const usedKeys = translationCalls.filter((key) => enJson[key])
const missingKeys = translationCalls.filter((key) => !enJson[key])
const unusedKeys = Object.keys(enJson).filter((key) => !translationCalls.includes(key))

console.log(`✅ Used translation keys: ${usedKeys.length}`)
console.log(`❌ Missing translation keys: ${missingKeys.length}`)
console.log(`🗑️  Unused translation keys: ${unusedKeys.length}\n`)

if (missingKeys.length > 0) {
    console.log('❌ Missing translation keys that exist in code but not in en.json:')
    missingKeys.forEach((key) => console.log(`   - ${key}`))
    console.log()
}

if (unusedKeys.length > 0) {
    console.log(`🗑️ ${unusedKeys.length} Unused translation keys that exist in en.json but not used in code:`)
    unusedKeys.forEach((key) => console.log(`   - ${key}`))

    console.log()
}

const usageRate = Math.round((usedKeys.length / Object.keys(enJson).length) * 100)
const coverageRate = Math.round((usedKeys.length / translationCalls.length) * 100)

console.log(`📈 Translation Usage Rate: ${usageRate}% (${usedKeys.length}/${Object.keys(enJson).length})`)
console.log(`📋 Translation Coverage Rate: ${coverageRate}% (${usedKeys.length}/${translationCalls.length})`)

if (missingKeys.length === 0 && usageRate === 100) {
    console.log('\n🎉 PERFECT! Translation system is now complete with 100% usage and coverage!')
} else if (missingKeys.length === 0) {
    console.log('\n✅ All translation calls are covered, but there are some unused keys remaining.')
} else {
    console.log('\n⚠️  Translation system needs additional work.')
}
