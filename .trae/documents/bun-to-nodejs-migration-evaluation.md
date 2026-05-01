# Bun 迁移到 Node.js 可行性评估

## 概述

评估将 Doge Code 项目从 Bun 运行时完全迁移到 Node.js 的工作量和可行性。

## 代码库分析 - Bun 使用情况

### 1. bun:bundle 特性系统（最大挑战）

**影响范围：100+ 个文件**

所有使用 `import { feature } from 'bun:bundle'` 的文件：
- `src/utils/config.ts`
- `src/utils/betas.ts`
- `src/constants/betas.ts`
- `src/context.ts`
- `src/QueryEngine.ts`
- `src/components/Settings/Config.tsx`
- `src/keybindings/defaultBindings.ts`
- `src/buddy/CompanionSprite.tsx`
- `src/buddy/useBuddyNotification.tsx`
- `src/buddy/prompt.ts`
- `src/voice/voiceModeEnabled.ts`
- `src/memdir/memdir.ts`
- `src/memdir/findRelevantMemories.ts`
- 所有 `/tools/` 目录下的文件
- 所有 `/commands/` 目录下的文件
- 所有 `/skills/` 目录下的文件
- 等等...

**功能说明**：
`bun:bundle` 是 Bun 的构建时特性系统，用于：
- 条件编译（类似 C 的 #ifdef）
- 死代码消除
- 特性开关控制

### 2. Bun 特有 API 使用

| API | 文件 | Node.js 替代方案 |
|------|------|-----------------|
| `Bun.hash` | `src/utils/hash.ts`, `src/buddy/companion.ts`, `src/utils/sessionStoragePortable.ts`, `src/services/api/promptCacheBreakDetection.ts` | Node `crypto` 模块 |
| `Bun.which` | `src/utils/which.ts` | 已有 Node 回退实现 |
| `Bun.stringWidth` | `src/ink/stringWidth.ts` | 已有纯 JS 回退实现 |
| `Bun.wrapAnsi` | `src/ink/wrapAnsi.ts` | 已有回退机制 |
| `Bun.file` | `src/utils/computerUse/platforms/linux.ts` | Node `fs/promises` |
| `Bun.listen` | `src/upstreamproxy/relay.ts` | Node `net` 模块 |
| `Bun.embeddedFiles` | `src/utils/bundledMode.ts` | 移除此检测或模拟 |

**好消息**：大部分 Bun API 已经有 Node.js 回退实现！

### 3. 打包和构建系统

- `package.json` 使用 `bun@1.3.5` 作为 packageManager
- 脚本使用 `bun run`
- 使用 TypeScript 的 ESM 格式
- 原生模块 `.node` 文件（`color-diff-napi`, `modifiers-napi`, `url-handler-napi`, `audio-capture`, `image-processor`）

## 迁移方案

### 方案 A：完整移除 Bun（激进方案）

**优点**：
- 完全脱离 Bun 依赖
- 更广泛的兼容性
- 更成熟的 Node 生态

**缺点**：
- 需要大规模重构（100+ 文件）
- 需要重新设计特性系统
- 性能可能下降
- 需要设置 TypeScript 编译流程

**步骤**：
1. 创建替代 `bun:bundle` 的特性系统
2. 替换所有 `import { feature } from 'bun:bundle'`
3. 移除所有 `Bun.*` API 依赖
4. 更新 package.json 脚本
5. 设置 TypeScript 编译（tsx 或 tsup）
6. 测试和修复

### 方案 B：保留 Bun 作为可选运行时（推荐）

**优点**：
- 保持向后兼容
- 风险较低
- 可以逐步过渡
- 项目已存在大量回退代码

**策略**：
1. 使用 `patch-feature.ts` 确保所有 feature 检查返回 true
2. 添加 TypeScript 编译支持（tsx）
3. 为所有剩余的 Bun API 添加完整回退
4. 更新文档说明两种运行时都支持

### 方案 C：混合方案（最佳平衡）

**核心思路**：
- 保留 Bun 作为主要开发和打包运行时
- 确保代码在 Node.js 中也能运行（使用已有回退）
- 使用 tsx 提供 Node 运行支持
- 移除对 `bun:bundle` 的强依赖

## 关键技术决策

### 特性系统替代方案

需要替换 `bun:bundle`：

**选项 1：环境变量驱动**
```typescript
// 所有 feature() 调用替换为 process.env 检查
if (process.env.FEATURE_X === 'true') { ... }
```

**选项 2：配置文件驱动**
```typescript
// 使用 config.ts 中的配置系统
if (getGlobalConfig().features.x) { ... }
```

**选项 3：构建时替换（推荐）**
```typescript
// 使用 esbuild/vite 的 define 选项
// 在构建时替换为布尔常量
if (FEATURE_X) { ... } // 构建时注入
```

### TypeScript 运行时选择

Node.js 下运行 TypeScript 的方案：

| 方案 | 优点 | 缺点 |
|------|------|------|
| **tsx** | 快速、简单、ESM 原生 | 外部依赖 |
| **tsup** | 打包为独立可执行 | 需要额外构建步骤 |
| **bun compile** | 原生支持 | 仍然依赖 Bun |

**推荐：使用 tsx**，因为：
- 已有的 Node 回退代码可以复用
- 安装简单：`npm install -g tsx`
- 无需预编译，直接运行

## 工作负载估算

| 任务 | 工作量 |
|------|--------|
| 分析现有代码和 bun 使用 | 已完成 |
| 替换 `bun:bundle` 导入（100+ 文件） | 高 |
| 替换剩余 Bun API | 中 |
| 设置 TypeScript 编译流程 | 低 |
| 更新 package.json 和脚本 | 低 |
| 测试和调试 | 中 |
| 文档更新 | 低 |
| **总计** | **中-高** |

## 风险分析

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 原生模块兼容性 | 高 | 中 | 确保 .node 文件也能在 Node 加载 |
| 性能下降 | 中 | 中 | 使用更快的哈希回退 |
| 功能回归 | 高 | 中 | 完整的回归测试 |
| 维护负担增加 | 中 | 低 | 保持两种运行时支持 |

## 建议和结论

### 近期建议（1-2周）

**不要完全移除 Bun！**

1. **保留 Bun 作为主要运行时**
2. **使用 tsx 增强 Node.js 支持**（添加开发脚本）
3. **确认所有已有回退代码正常工作**
4. **移除 `bun:bundle` 的强依赖**（使用 patch-feature.ts）

### 中期建议（1-2月）

1. 如果确实需要纯 Node，考虑使用 esbuild/vite 替代 `bun:bundle`
2. 逐步迁移到纯 Node 兼容代码

## 最终结论

**可能性：可以实现，但成本较高**

- **完全移除 Bun 可行，但需要大量重构（100+ 文件）**
- **更推荐方案：保留 Bun 作为可选运行时，确保 Node 也能运行**
- **项目已有良好的回退基础，工作量可控**

**最佳路径**：
1. 先做方案 C（混合方案），确保双运行时支持
2. 根据用户反馈决定是否继续完全移除 Bun
