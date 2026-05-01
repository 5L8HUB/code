// Content for the verify bundled skill.
// 在 Node.js 和 Bun 下都能用手动读取文件的方式

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadFile(relativePath: string): string {
  const fullPath = path.join(__dirname, relativePath)
  return readFileSync(fullPath, 'utf-8')
}

// 直接读取文件，兼容所有环境
export const SKILL_MD: string = loadFile('./verify/SKILL.md')

export const SKILL_FILES: Record<string, string> = {
  'examples/cli.md': loadFile('./verify/examples/cli.md'),
  'examples/server.md': loadFile('./verify/examples/server.md'),
}
