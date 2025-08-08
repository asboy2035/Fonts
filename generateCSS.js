const fs = require('fs')
const path = require('path')

const fontsRootDir = './'               // Root where font folders live (adjust if needed)
const cssOutputDir = path.join('css')  // Output CSS folder

// Helpers
function getFontFormat(ext) {
  switch (ext.toLowerCase()) {
    case '.woff': return 'woff'
    case '.woff2': return 'woff2'
    case '.ttf': return 'truetype'
    case '.otf': return 'opentype'
    case '.eot': return 'embedded-opentype'
    case '.svg': return 'svg'
    default: return ''
  }
}

// Convert string to This-Case-With-Dashes (PascalCase-ish with dashes)
function toThisCase(str) {
  return str
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

// Try to parse weight and style from filename
function parseFontWeightAndStyle(filename) {
  const lower = filename.toLowerCase()

  // Default values
  let weight = 'normal'
  let style = 'normal'

  // Weight detection
  if (lower.includes('thin')) weight = '100'
  else if (lower.includes('extralight') || lower.includes('extra-light')) weight = '200'
  else if (lower.includes('light')) weight = '300'
  else if (lower.includes('regular') || lower.includes('normal')) weight = '400'
  else if (lower.includes('medium')) weight = '500'
  else if (lower.includes('semibold') || lower.includes('semi-bold')) weight = '600'
  else if (lower.includes('bold')) weight = '700'
  else if (lower.includes('extrabold') || lower.includes('extra-bold') || lower.includes('heavy')) weight = '800'
  else if (lower.includes('black')) weight = '900'

  // Style detection
  if (lower.includes('italic')) style = 'italic'
  else if (lower.includes('oblique')) style = 'oblique'

  return { weight, style }
}

// Ensure CSS output folder exists
if (!fs.existsSync(cssOutputDir)) {
  fs.mkdirSync(cssOutputDir, { recursive: true })
}

// Get list of folders in root (filtering out css and others)
const folders = fs.readdirSync(
  fontsRootDir,
  { withFileTypes: true }
)
.filter(dirent => dirent.isDirectory() && dirent.name !== 'css' && !dirent.name.startsWith('.'))
.map(dirent => dirent.name)

const jsDelivrBaseURL = 'https://cdn.jsdelivr.net/gh/asboy2035/fonts@master' // Your jsDelivr base

folders.forEach(folderName => {
  const folderPath = path.join(fontsRootDir, folderName)
  const files = fs.readdirSync(folderPath).filter(f => /\.(woff2?|ttf|otf|eot|svg)$/i.test(f))

  if (files.length === 0) {
    console.log(`No fonts found in folder: ${folderName}, skipping.`)
    return
  }

  let cssContent = ''

  files.forEach(file => {
    const ext = path.extname(file)
    const format = getFontFormat(ext)
    const baseName = path.basename(file, ext)
    const { weight, style } = parseFontWeightAndStyle(baseName)

    const fontFamily = folderName.trim()

    // Build the jsDelivr URL
    // Make sure to encodeURIComponent folder and file names to be safe
    const fontURL = `${jsDelivrBaseURL}/${encodeURIComponent(folderName)}/${encodeURIComponent(file)}`

    cssContent += `
@font-face {
  font-family: '${fontFamily}';
  src: url('${fontURL}') format('${format}');
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}
`.trim() + '\n\n'
  })

  const cssFileName = toThisCase(folderName) + '.css'
  const cssFilePath = path.join(cssOutputDir, cssFileName)

  fs.writeFileSync(cssFilePath, cssContent)

  console.log(`✅ Created CSS for "${folderName}" → ${cssFilePath}`)
})


// After processing all folders, run git add .
const { exec } = require('child_process')
exec('git add .', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running git add: ${error.message}`)
    return
  }
  if (stderr) {
    console.error(`Git add stderr: ${stderr}`)
    return
  }
  console.log('✅ Successfully ran git add .')
})
