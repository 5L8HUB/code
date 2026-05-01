// Content for the claude-api bundled skill.
// 在 Node.js 和 Bun 下都能用手动读取文件的方式

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadFile(relativePath: string): string {
  const fullPath = path.join(__dirname, relativePath)
  return readFileSync(fullPath, 'utf-8')
}

// @[MODEL LAUNCH]: Update the model IDs/names below. These are substituted into {{VAR}}
// placeholders in the .md files at runtime before the skill prompt is sent.
// After updating these constants, manually update the two files that still hardcode models:
//   - claude-api/SKILL.md (Current Models pricing table)
//   - claude-api/shared/models.md (full model catalog with legacy versions and alias mappings)
export const SKILL_MODEL_VARS = {
  OPUS_ID: 'claude-opus-4-6',
  OPUS_NAME: 'Claude Opus 4.6',
  SONNET_ID: 'claude-sonnet-4-6',
  SONNET_NAME: 'Claude Sonnet 4.6',
  HAIKU_ID: 'claude-haiku-4-5',
  HAIKU_NAME: 'Claude Haiku 4.5',
  // Previous Sonnet ID — used in "do not append date suffixes" example in SKILL.md.
  PREV_SONNET_ID: 'claude-sonnet-4-5',
} satisfies Record<string, string>

// 直接读取文件，兼容所有环境
export const SKILL_PROMPT: string = loadFile('./claude-api/SKILL.md')

export const SKILL_FILES: Record<string, string> = {
  'csharp/claude-api.md': loadFile('./claude-api/csharp/claude-api.md'),
  'curl/examples.md': loadFile('./claude-api/curl/examples.md'),
  'go/claude-api.md': loadFile('./claude-api/go/claude-api.md'),
  'java/claude-api.md': loadFile('./claude-api/java/claude-api.md'),
  'php/claude-api.md': loadFile('./claude-api/php/claude-api.md'),
  'python/agent-sdk/README.md': loadFile('./claude-api/python/agent-sdk/README.md'),
  'python/agent-sdk/patterns.md': loadFile('./claude-api/python/agent-sdk/patterns.md'),
  'python/claude-api/README.md': loadFile('./claude-api/python/claude-api/README.md'),
  'python/claude-api/batches.md': loadFile('./claude-api/python/claude-api/batches.md'),
  'python/claude-api/files-api.md': loadFile('./claude-api/python/claude-api/files-api.md'),
  'python/claude-api/streaming.md': loadFile('./claude-api/python/claude-api/streaming.md'),
  'python/claude-api/tool-use.md': loadFile('./claude-api/python/claude-api/tool-use.md'),
  'ruby/claude-api.md': loadFile('./claude-api/ruby/claude-api.md'),
  'shared/error-codes.md': loadFile('./claude-api/shared/error-codes.md'),
  'shared/live-sources.md': loadFile('./claude-api/shared/live-sources.md'),
  'shared/models.md': loadFile('./claude-api/shared/models.md'),
  'shared/prompt-caching.md': loadFile('./claude-api/shared/prompt-caching.md'),
  'shared/tool-use-concepts.md': loadFile('./claude-api/shared/tool-use-concepts.md'),
  'typescript/agent-sdk/README.md': loadFile('./claude-api/typescript/agent-sdk/README.md'),
  'typescript/agent-sdk/patterns.md': loadFile('./claude-api/typescript/agent-sdk/patterns.md'),
  'typescript/claude-api/README.md': loadFile('./claude-api/typescript/claude-api/README.md'),
  'typescript/claude-api/batches.md': loadFile('./claude-api/typescript/claude-api/batches.md'),
  'typescript/claude-api/files-api.md': loadFile('./claude-api/typescript/claude-api/files-api.md'),
  'typescript/claude-api/streaming.md': loadFile('./claude-api/typescript/claude-api/streaming.md'),
  'typescript/claude-api/tool-use.md': loadFile('./claude-api/typescript/claude-api/tool-use.md'),
}
