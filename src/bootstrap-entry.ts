#!/usr/bin/env bun
// 在非 Bun 环境下加载 polyfills
if (typeof Bun === 'undefined') {
  // 动态加载 polyfill，避免在 Bun 环境下不必要的导入
  await import('./utils/bunApiPolyfill.js')
}

import { ensureBootstrapMacro } from './bootstrapMacro'

ensureBootstrapMacro()

await import('./entrypoints/cli.tsx')

