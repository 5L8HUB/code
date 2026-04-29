import type { CustomApiProvider } from '../customApiStorage.js'

export type ProviderPreset = {
  name: string
  provider: CustomApiProvider
  baseURL: string
  description: string
  models?: string[]
  defaultModel?: string
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: 'Anthropic',
    provider: 'anthropic',
    baseURL: 'https://api.anthropic.com',
    description: 'Anthropic Claude API',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-3-5-sonnet-20241022'],
    defaultModel: 'claude-sonnet-4-20250514',
  },
  {
    name: 'OpenAI',
    provider: 'openai',
    baseURL: 'https://api.openai.com/v1',
    description: 'OpenAI GPT API',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
    defaultModel: 'gpt-4o',
  },
  {
    name: 'DeepSeek',
    provider: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    description: 'DeepSeek API',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
  },
  {
    name: '智谱 BigModel',
    provider: 'bigmodel',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    description: '智谱 GLM 大模型',
    models: ['glm-4-plus', 'glm-4-0520', 'glm-4', 'glm-4-flash', 'glm-3-turbo'],
    defaultModel: 'glm-4-flash',
  },
  {
    name: '智谱 Coding Plan',
    provider: 'zhipu-coding',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    description: '智谱编程专用计划',
    models: ['glm-4-plus', 'glm-4', 'glm-4-flash'],
    defaultModel: 'glm-4-flash',
  },
  {
    name: 'MinMax Token Plan',
    provider: 'minimax',
    baseURL: 'https://api.minimax.chat/v1',
    description: 'MinMax API',
    models: ['abab6.5s-chat', 'abab6.5g-chat', 'abab5.5-chat'],
    defaultModel: 'abab6.5s-chat',
  },
  {
    name: '小米 Token Plan',
    provider: 'xiaomi',
    baseURL: 'https://api.xiaomi.com/v1',
    description: '小米 AI API',
    models: ['mi-chat', 'mi-coder'],
    defaultModel: 'mi-chat',
  },
]

export function getProviderPreset(provider: CustomApiProvider): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find(p => p.provider === provider)
}

export function getProviderPresetByName(name: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find(p => p.name === name)
}

export function getDefaultModelForProvider(provider: CustomApiProvider): string | undefined {
  const preset = getProviderPreset(provider)
  return preset?.defaultModel
}

export function getModelsForProvider(provider: CustomApiProvider): string[] {
  const preset = getProviderPreset(provider)
  return preset?.models ?? []
}
