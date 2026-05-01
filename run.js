#!/usr/bin/env node
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bootstrapEntry = path.join(__dirname, 'src', 'bootstrap-entry.ts')

const args = process.argv.slice(2)

// 检查 Bun 是否可用
let useBun = false
try {
  execSync('bun --version', { stdio: 'ignore' })
  useBun = true
} catch {
  useBun = false
}

if (useBun) {
  console.log('[Doge Code] Using Bun (faster runtime)')
  const result = execSync(`bun run ${bootstrapEntry} ${args.join(' ')}`, { stdio: 'inherit' })
} else {
  console.log('[Doge Code] Using Node.js with tsx (compatible mode)')
  try {
    // 尝试用本地安装的 tsx
    execSync(`npx tsx ${bootstrapEntry} ${args.join(' ')}`, { stdio: 'inherit' })
  } catch {
    console.error('[Doge Code] Error: Failed to run with tsx')
    process.exit(1)
  }
}
