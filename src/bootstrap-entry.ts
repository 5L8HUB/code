#!/usr/bin/env bun
// 在非 Bun 环境下加载 polyfills
if (typeof Bun === 'undefined') {
  console.log('[Doge Code] Loading Bun polyfills for Node.js...')
  // 注意：这会在 Node 环境下尝试加载 polyfills
  // 但首先需要修复模块加载路径问题
}

import { ensureBootstrapMacro } from './bootstrapMacro'

ensureBootstrapMacro()

await import('./entrypoints/cli.tsx')

