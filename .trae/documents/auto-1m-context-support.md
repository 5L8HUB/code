# 根据模型自动开启 1M 上下文调用

## 概述

改进 CLI，使其能够根据模型名称自动识别并开启 1M 上下文调用，特别是针对 DeepSeek V4 Flash/Pro 和小米 MiMo V2.5 Pro/V2 等支持长上下文的模型。

## 当前架构分析

### 1M 上下文触发机制

项目中有三种方式触发 1M 上下文：

1. **模型名称后缀**: 在模型名后添加 `[1m]`，如 `deepseek-chat[1m]`
2. **Beta Header**: 通过 `CONTEXT_1M_BETA_HEADER` 在 API 请求中传递
3. **模型支持检测**: 通过 `modelSupports1M()` 函数自动判断

### 关键文件

| 文件 | 作用 |
|------|------|
| [src/utils/context.ts](file:///workspace/doge-code/src/utils/context.ts) | 上下文窗口管理，`modelSupports1M()` 函数 |
| [src/utils/betas.ts](file:///workspace/doge-code/src/utils/betas.ts) | Beta header 管理 |
| [src/services/api/claude.ts](file:///workspace/doge-code/src/services/api/claude.ts) | API 调用，动态添加 1M beta |
| [src/utils/model/providerPresets.ts](file:///workspace/doge-code/src/utils/model/providerPresets.ts) | Provider 预设配置 |

### 当前支持的 1M 模型

```typescript
// src/utils/context.ts:43-48
export function modelSupports1M(model: string): boolean {
  const canonical = getCanonicalName(model)
  return canonical.includes('claude-sonnet-4') || canonical.includes('opus-4-6')
}
```

## 需要支持 1M 上下文的模型

| Provider | 模型 | 上下文长度 |
|----------|------|-----------|
| DeepSeek | deepseek-chat (V4) | 1M tokens |
| DeepSeek | deepseek-reasoner | 1M tokens |
| 小米 | mi-chat (MiMo V2.5 Pro) | 1M tokens |
| 小米 | mi-coder (MiMo V2) | 1M tokens |

## 实现方案

### 方案 A: 扩展 modelSupports1M 函数 (推荐)

**优点**: 简单直接，与现有架构一致
**缺点**: 需要硬编码模型名称模式

```typescript
// src/utils/context.ts
export function modelSupports1M(model: string): boolean {
  if (is1mContextDisabled()) return false
  const canonical = getCanonicalName(model).toLowerCase()
  
  // Claude models
  if (canonical.includes('claude-sonnet-4') || canonical.includes('opus-4-6')) {
    return true
  }
  
  // DeepSeek models
  if (canonical.includes('deepseek-chat') || canonical.includes('deepseek-reasoner')) {
    return true
  }
  
  // 小米 MiMo models
  if (canonical.includes('mimo') || canonical.includes('mi-chat') || canonical.includes('mi-coder')) {
    return true
  }
  
  return false
}
```

### 方案 B: 配置化的模型能力系统

**优点**: 更灵活，可通过配置文件扩展
**缺点**: 需要更多代码改动

在 `providerPresets.ts` 中添加 `supports1M` 字段：

```typescript
export type ProviderPreset = {
  name: string
  provider: CustomApiProvider
  baseURL: string
  description: string
  models?: string[]
  defaultModel?: string
  modelCapabilities?: Record<string, { supports1M?: boolean }>
}
```

### 方案 C: 环境变量覆盖

允许用户通过环境变量指定支持 1M 的模型：

```bash
ANTHROPIC_1M_MODELS=deepseek-chat,deepseek-reasoner,mi-chat,mi-coder
```

## 推荐方案

采用 **方案 A + 方案 C 结合**：
1. 扩展 `modelSupports1M()` 函数内置支持常见模型
2. 添加环境变量 `ANTHROPIC_1M_MODELS` 允许用户自定义

## 实施步骤

### 1. 更新 providerPresets.ts

添加模型别名和 1M 上下文支持标识：

```typescript
{
  name: 'DeepSeek',
  provider: 'deepseek',
  baseURL: 'https://api.deepseek.com',
  description: 'DeepSeek API',
  models: ['deepseek-chat', 'deepseek-reasoner'],
  defaultModel: 'deepseek-chat',
  supports1MModels: ['deepseek-chat', 'deepseek-reasoner'],
},
{
  name: '小米 Token Plan',
  provider: 'xiaomi',
  baseURL: 'https://api.xiaomi.com/v1',
  description: '小米 AI API',
  models: ['mi-chat', 'mi-coder'],
  defaultModel: 'mi-chat',
  supports1MModels: ['mi-chat', 'mi-coder'],
},
```

### 2. 扩展 context.ts 中的 modelSupports1M

```typescript
export function modelSupports1M(model: string): boolean {
  if (is1mContextDisabled()) return false
  
  const canonical = getCanonicalName(model).toLowerCase()
  
  // Claude models with 1M support
  if (canonical.includes('claude-sonnet-4') || canonical.includes('opus-4-6')) {
    return true
  }
  
  // DeepSeek models with 1M support
  if (canonical.includes('deepseek-chat') || canonical.includes('deepseek-reasoner')) {
    return true
  }
  
  // Xiaomi MiMo models with 1M support
  if (canonical.includes('mi-chat') || canonical.includes('mi-coder') || canonical.includes('mimo')) {
    return true
  }
  
  // Custom models via environment variable
  const custom1MModels = process.env.ANTHROPIC_1M_MODELS?.split(',').map(m => m.trim().toLowerCase()) ?? []
  if (custom1MModels.some(m => canonical.includes(m))) {
    return true
  }
  
  return false
}
```

### 3. 更新 getContextWindowForModel

确保第三方 Provider 的模型也能正确获取 1M 上下文窗口：

```typescript
export function getContextWindowForModel(model: string, betas?: string[]): number {
  // ... existing code ...
  
  // Check if model supports 1M via modelSupports1M
  if (modelSupports1M(model)) {
    return 1_000_000
  }
  
  // ... rest of the function ...
}
```

### 4. 更新 API 调用逻辑

在 `claude.ts` 中确保第三方 Provider 的 1M 请求正确处理：

```typescript
// For 3P providers, add 1M beta if model supports it
if (getAPIProvider() !== 'firstParty' && modelSupports1M(model)) {
  if (!betasParams.includes(CONTEXT_1M_BETA_HEADER)) {
    betasParams.push(CONTEXT_1M_BETA_HEADER)
  }
}
```

### 5. 更新 README.md

添加 1M 上下文支持的说明文档。

## 验证步骤

1. 运行 `bun run version` 确保项目正常启动
2. 测试 DeepSeek 模型的 1M 上下文
3. 测试小米模型的 1M 上下文
4. 测试环境变量自定义模型

## 注意事项

- 不同 Provider 的 1M 上下文实现可能不同
- DeepSeek 使用 OpenAI 兼容 API，需要确认是否需要特殊处理
- 小米 API 的具体实现需要验证
- 保持向后兼容，不影响现有 Claude 模型的行为
