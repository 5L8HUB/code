/**
 * Bun bundle 特性系统的 polyfill
 * 替代 `import { feature } from 'bun:bundle'`
 * 确保在 Node.js 下也能正常工作
 */

import { getGlobalConfig } from './config.js'

/**
 * 检查特性是否启用
 * 在 Doge Code 中，所有特性都已通过 patch-feature.ts 强制开启
 * @param featureName 特性名称
 * @returns 总是返回 true
 */
export function feature(featureName: string): boolean {
  // 所有特性默认开启
  return true
}

/**
 * 特性名称常量（参考）
 */
export const FEATURES = {
  BUDDY: 'buddy',
  VOICE: 'voice',
  AGENT_TEAMS: 'agent_teams',
  AUTO_COMPACT: 'auto_compact',
  MEMDIR: 'memdir',
  PLAN_MODE: 'plan_mode',
  TASK_LIST: 'task_list',
  MCP_TOOLS: 'mcp_tools',
} as const

export default feature

