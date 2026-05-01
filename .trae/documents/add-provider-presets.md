# 添加多个 Provider 预设配置

## 概述

为项目添加 DeepSeek、OpenAI、智谱 BigModel、智谱 Coding Plan、MinMax Token Plan、小米 Token Plan 等 provider 预设配置，方便用户快速切换不同的 API 服务。

## 当前架构分析

### 现有 Provider 支持
- `CustomApiProvider`: `'anthropic' | 'openai' | 'gemini'`
- `customApiEndpoint` 配置存储在 `~/.doge/secure-storage.json`
- 支持自定义 `baseURL` 和 `apiKey`

### 关键文件
1. [src/utils/customApiStorage.ts](file:///workspace/doge-code/src/utils/customApiStorage.ts) - 自定义 API 存储逻辑
2. [src/services/api/openaiCompat.ts](file:///workspace/doge-code/src/services/api/openaiCompat.ts) - OpenAI 兼容 API 实现
3. [src/utils/config.ts](file:///workspace/doge-code/src/utils/config.ts) - 全局配置类型定义
4. [src/components/Settings/Config.tsx](file:///workspace/doge-code/src/components/Settings/Config.tsx) - 设置 UI 组件

## Provider 预设配置

### 新增 Provider 列表

| Provider | baseURL | 说明 |
|----------|---------|------|
| DeepSeek | `https://api.deepseek.com` | DeepSeek API |
| OpenAI | `https://api.openai.com` | OpenAI 官方 API |
| BigModel | `https://open.bigmodel.cn/api/paas/v4` | 智谱 GLM 模型 |
| 智谱 Coding Plan | `https://open.bigmodel.cn/api/paas/v4` | 智谱编程专用 |
| MinMax Token Plan | `https://api.minimax.chat/v1` | MinMax API |
| 小米 Token Plan | 待确认 | 小米 AI API |

## 实现方案

### 1. 扩展 Provider 类型

**文件**: `src/utils/customApiStorage.ts`

```typescript
export type CustomApiProvider = 
  | 'anthropic' 
  | 'openai' 
  | 'gemini'
  | 'deepseek'
  | 'bigmodel'
  | 'zhipu-coding'
  | 'minimax'
  | 'xiaomi'
```

### 2. 添加 Provider 预设配置

**新文件**: `src/utils/model/providerPresets.ts`

```typescript
export type ProviderPreset = {
  name: string
  provider: CustomApiProvider
  baseURL: string
  description: string
  models?: string[]
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: 'Anthropic',
    provider: 'anthropic',
    baseURL: 'https://api.anthropic.com',
    description: 'Anthropic Claude API',
  },
  {
    name: 'OpenAI',
    provider: 'openai',
    baseURL: 'https://api.openai.com/v1',
    description: 'OpenAI GPT API',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    name: 'DeepSeek',
    provider: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    description: 'DeepSeek API',
    models: ['deepseek-chat', 'deepseek-coder'],
  },
  {
    name: '智谱 BigModel',
    provider: 'bigmodel',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    description: '智谱 GLM 大模型',
    models: ['glm-4', 'glm-4-flash', 'glm-3-turbo'],
  },
  {
    name: '智谱 Coding Plan',
    provider: 'zhipu-coding',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    description: '智谱编程专用计划',
    models: ['glm-4', 'glm-4-flash'],
  },
  {
    name: 'MinMax Token Plan',
    provider: 'minimax',
    baseURL: 'https://api.minimax.chat/v1',
    description: 'MinMax API',
    models: ['abab6.5-chat', 'abab5.5-chat'],
  },
  {
    name: '小米 Token Plan',
    provider: 'xiaomi',
    baseURL: 'https://api.xiaomi.com/v1', // 待确认
    description: '小米 AI API',
  },
]
```

### 3. 更新设置 UI

**文件**: `src/components/Settings/Config.tsx`

添加 Provider 选择器，显示预设列表，允许用户快速选择并配置。

### 4. 更新 API 调用逻辑

**文件**: `src/services/api/openaiCompat.ts`

确保所有 provider 都使用 OpenAI 兼容模式进行 API 调用。

## 实施步骤

1. **创建 providerPresets.ts** - 定义所有 provider 预设
2. **扩展 CustomApiProvider 类型** - 在 customApiStorage.ts 中
3. **更新 Config.tsx** - 添加 provider 选择 UI
4. **更新 auth.ts** - 支持不同 provider 的认证
5. **测试验证** - 确保各 provider API 调用正常
6. **更新 README.md** - 添加 provider 配置说明
7. **提交并推送** - 推送到仓库

## 验证步骤

1. 运行 `bun run version` 确保项目正常启动
2. 检查类型定义是否正确
3. 验证 UI 显示是否正常

## 注意事项

- 小米 API 的 baseURL 需要用户确认
- 所有新增 provider 都使用 OpenAI 兼容模式
- 保持向后兼容，不影响现有配置
