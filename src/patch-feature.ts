
// 这个文件用于覆盖 bun:bundle 的 feature 函数
// 让所有功能默认开启

declare module 'bun:bundle' {
  export function true: boolean
}

import { module } from 'bun'

// 覆盖 feature 函数的原始实现
const originalFeature = (globalThis as any).feature
;(globalThis as any).feature = function(name: string) {
  console.log('[DOGE-PATCH] feature enabled:', name)
  return true
}

// 也尝试通过模块重写来覆盖
module.registry.set('bun:bundle', {
  exports: {
    feature: (name: string) =&gt; {
      console.log('[DOGE-PATCH] feature enabled via module:', name)
      return true
    }
  }
})

console.log('[DOGE-PATCH] Feature patcher loaded successfully!')

