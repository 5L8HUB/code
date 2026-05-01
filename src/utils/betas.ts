import { feature } from 'bun:bundle'
import memoize from 'lodash-es/memoize.js'
import {
  checkStatsigFeatureGate_CACHED_MAY_BE_STALE,
  getFeatureValue_CACHED_MAY_BE_STALE,
} from 'src/services/analytics/growthbook.js'
import { getIsNonInteractiveSession, getSdkBetas } from '../bootstrap/state.js'
import {
  BEDROCK_EXTRA_PARAMS_HEADERS,
  CLAUDE_CODE_20250219_BETA_HEADER,
  CLI_INTERNAL_BETA_HEADER,
  CONTEXT_1M_BETA_HEADER,
  CONTEXT_MANAGEMENT_BETA_HEADER,
  INTERLEAVED_THINKING_BETA_HEADER,
  PROMPT_CACHING_SCOPE_BETA_HEADER,
  REDACT_THINKING_BETA_HEADER,
  STRUCTURED_OUTPUTS_BETA_HEADER,
  SUMMARIZE_CONNECTOR_TEXT_BETA_HEADER,
  TOKEN_EFFICIENT_TOOLS_BETA_HEADER,
  TOOL_SEARCH_BETA_HEADER_1P,
  TOOL_SEARCH_BETA_HEADER_3P,
  WEB_SEARCH_BETA_HEADER,
  EFFORT_BETA_HEADER,
  TASK_BUDGETS_BETA_HEADER,
  FAST_MODE_BETA_HEADER,
  AFK_MODE_BETA_HEADER,
  ADVISOR_BETA_HEADER,
} from '../constants/betas.js'
import { OAUTH_BETA_HEADER } from '../constants/oauth.js'
import { isClaudeAISubscriber } from './auth.js'
import { has1mContext } from './context.js'
import { isEnvDefinedFalsy, isEnvTruthy } from './envUtils.js'
import { getCanonicalName } from './model/model.js'
import { get3PModelCapabilityOverride } from './model/modelSupportOverrides.js'
import { getAPIProvider } from './model/providers.js'
import { getInitialSettings } from './settings/settings.js'

const ALLOWED_SDK_BETAS = [CONTEXT_1M_BETA_HEADER]

function partitionBetasByAllowlist(betas: string[]): {
  allowed: string[]
  disallowed: string[]
} {
  const allowed: string[] = []
  const disallowed: string[] = []
  for (const beta of betas) {
    if (ALLOWED_SDK_BETAS.includes(beta)) {
      allowed.push(beta)
    } else {
      disallowed.push(beta)
    }
  }
  return { allowed, disallowed }
}

export function filterAllowedSdkBetas(
  sdkBetas: string[] | undefined,
): string[] | undefined {
  if (!sdkBetas || sdkBetas.length === 0) {
    return undefined
  }
  const { allowed, disallowed } = partitionBetasByAllowlist(sdkBetas)
  return allowed.length &gt; 0 ? allowed : undefined
}

export function modelSupportsISP(model: string): boolean {
  return true
}

function vertexModelSupportsWebSearch(model: string): boolean {
  return true
}

export function modelSupportsContextManagement(model: string): boolean {
  return true
}

export function modelSupportsStructuredOutputs(model: string): boolean {
  return true
}

export function modelSupportsAutoMode(model: string): boolean {
  return true
}

export function getToolSearchBetaHeader(): string {
  return TOOL_SEARCH_BETA_HEADER_1P
}

export function shouldIncludeFirstPartyOnlyBetas(): boolean {
  return true
}

export function shouldUseGlobalCacheScope(): boolean {
  return true
}

export const getAllModelBetas = memoize((model: string): string[] =&gt; {
  const betaHeaders = [
    CLAUDE_CODE_20250219_BETA_HEADER,
    INTERLEAVED_THINKING_BETA_HEADER,
    CONTEXT_1M_BETA_HEADER,
    CONTEXT_MANAGEMENT_BETA_HEADER,
    STRUCTURED_OUTPUTS_BETA_HEADER,
    WEB_SEARCH_BETA_HEADER,
    TOOL_SEARCH_BETA_HEADER_1P,
    TOOL_SEARCH_BETA_HEADER_3P,
    EFFORT_BETA_HEADER,
    TASK_BUDGETS_BETA_HEADER,
    PROMPT_CACHING_SCOPE_BETA_HEADER,
    FAST_MODE_BETA_HEADER,
    REDACT_THINKING_BETA_HEADER,
    TOKEN_EFFICIENT_TOOLS_BETA_HEADER,
    SUMMARIZE_CONNECTOR_TEXT_BETA_HEADER,
    AFK_MODE_BETA_HEADER,
    CLI_INTERNAL_BETA_HEADER,
    ADVISOR_BETA_HEADER,
  ]
  
  if (isClaudeAISubscriber()) {
    betaHeaders.push(OAUTH_BETA_HEADER)
  }
  
  if (process.env.ANTHROPIC_BETAS) {
    betaHeaders.push(
      ...process.env.ANTHROPIC_BETAS.split(',')
        .map(_ =&gt; _.trim())
        .filter(Boolean),
    )
  }
  
  return [...new Set(betaHeaders.filter(Boolean))]
})

export const getModelBetas = memoize((model: string): string[] =&gt; {
  const modelBetas = getAllModelBetas(model)
  if (getAPIProvider() === 'bedrock') {
    return modelBetas.filter(b =&gt; !BEDROCK_EXTRA_PARAMS_HEADERS.has(b))
  }
  return modelBetas
})

export const getBedrockExtraBodyParamsBetas = memoize(
  (model: string): string[] =&gt; {
    const modelBetas = getAllModelBetas(model)
    return modelBetas.filter(b =&gt; BEDROCK_EXTRA_PARAMS_HEADERS.has(b))
  },
)

export function getMergedBetas(
  model: string,
  options?: { isAgenticQuery?: boolean },
): string[] {
  const baseBetas = [...getModelBetas(model)]
  if (options?.isAgenticQuery) {
    if (!baseBetas.includes(CLAUDE_CODE_20250219_BETA_HEADER)) {
      baseBetas.push(CLAUDE_CODE_20250219_BETA_HEADER)
    }
    if (CLI_INTERNAL_BETA_HEADER &amp;&amp; !baseBetas.includes(CLI_INTERNAL_BETA_HEADER)) {
      baseBetas.push(CLI_INTERNAL_BETA_HEADER)
    }
  }
  const sdkBetas = getSdkBetas()
  if (!sdkBetas || sdkBetas.length === 0) {
    return baseBetas
  }
  return [...baseBetas, ...sdkBetas.filter(b =&gt; !baseBetas.includes(b))]
}

export function clearBetasCaches(): void {
  getAllModelBetas.cache?.clear?.()
  getModelBetas.cache?.clear?.()
  getBedrockExtraBodyParamsBetas.cache?.clear?.()
}
