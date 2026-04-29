import type { Message } from '../../types/message.js'
import { logForDebugging } from '../../utils/debug.js'
import { getGlobalConfig } from '../../utils/config.js'
import { tokenCountWithEstimation } from '../../utils/tokens.js'
import { getAutoCompactConfig, type AutoCompactStrategy } from './autoCompact.js'

export interface ContextAnalysisResult {
  totalTokens: number
  messageCount: number
  averageTokensPerMessage: number
  oldestMessageAge: number
  redundantContentScore: number
  compressionPotential: number
  recommendedAction: 'compact' | 'wait' | 'warn'
  reason: string
}

export interface MessageImportance {
  messageIndex: number
  importance: number
  reason: string
  tokens: number
  canCompress: boolean
}

const IMPORTANCE_WEIGHTS = {
  systemMessage: 1.0,
  userQuestion: 0.9,
  codeBlock: 0.85,
  toolResult: 0.7,
  assistantResponse: 0.6,
  smallTalk: 0.3,
}

export function analyzeContext(messages: Message[]): ContextAnalysisResult {
  const config = getAutoCompactConfig()
  const totalTokens = tokenCountWithEstimation(messages)
  const messageCount = messages.length
  const averageTokensPerMessage = messageCount > 0 ? totalTokens / messageCount : 0
  
  const now = Date.now()
  const oldestTimestamp = messages[0]?.timestamp ?? now
  const oldestMessageAge = now - oldestTimestamp
  
  const redundantContentScore = calculateRedundancyScore(messages)
  const compressionPotential = calculateCompressionPotential(messages)
  
  const thresholdPercent = config.thresholdPercent
  const currentPercent = totalTokens / 200000
  
  let recommendedAction: 'compact' | 'wait' | 'warn' = 'wait'
  let reason = ''
  
  if (currentPercent >= thresholdPercent) {
    if (compressionPotential > 0.5) {
      recommendedAction = 'compact'
      reason = `Context at ${(currentPercent * 100).toFixed(1)}% capacity with ${(compressionPotential * 100).toFixed(0)}% compression potential`
    } else {
      recommendedAction = 'warn'
      reason = `Context at ${(currentPercent * 100).toFixed(1)}% capacity but low compression potential`
    }
  } else if (currentPercent >= thresholdPercent * 0.9) {
    recommendedAction = 'warn'
    reason = `Context approaching threshold at ${(currentPercent * 100).toFixed(1)}%`
  } else {
    reason = `Context healthy at ${(currentPercent * 100).toFixed(1)}%`
  }
  
  return {
    totalTokens,
    messageCount,
    averageTokensPerMessage,
    oldestMessageAge,
    redundantContentScore,
    compressionPotential,
    recommendedAction,
    reason,
  }
}

function calculateRedundancyScore(messages: Message[]): number {
  if (messages.length < 3) return 0
  
  let redundancyScore = 0
  const textSet = new Set<string>()
  
  for (const message of messages) {
    const text = getMessageText(message)
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    
    let duplicateCount = 0
    for (const word of words) {
      if (textSet.has(word)) {
        duplicateCount++
      } else {
        textSet.add(word)
      }
    }
    
    if (words.length > 0) {
      redundancyScore += duplicateCount / words.length
    }
  }
  
  return Math.min(1, redundancyScore / messages.length)
}

function calculateCompressionPotential(messages: Message[]): number {
  if (messages.length < 5) return 0
  
  const config = getAutoCompactConfig()
  const preserveCount = config.preserveRecentCount
  const compressibleCount = messages.length - preserveCount
  
  if (compressibleCount <= 0) return 0
  
  const importanceScores = messages.map((m, i) => ({
    index: i,
    importance: calculateMessageImportance(m, i, messages.length),
  }))
  
  const compressibleMessages = importanceScores
    .filter((_, i) => i < messages.length - preserveCount)
    .filter(s => s.importance.importance < 0.8)
  
  const potentialSavings = compressibleMessages.reduce((sum, s) => {
    const msg = messages[s.index]
    const tokens = msg ? tokenCountWithEstimation([msg]) : 0
    return sum + tokens * (1 - s.importance.importance)
  }, 0)
  
  const totalTokens = tokenCountWithEstimation(messages)
  return totalTokens > 0 ? potentialSavings / totalTokens : 0
}

export function calculateMessageImportance(
  message: Message,
  index: number,
  totalMessages: number,
): { importance: number; reason: string; canCompress: boolean } {
  const recencyFactor = index / totalMessages
  let baseImportance = 0.5
  let reason = 'standard message'
  let canCompress = true
  
  const text = getMessageText(message)
  const hasCodeBlock = /```[\s\S]*?```/.test(text)
  const hasQuestion = /\?/.test(text)
  const isLong = text.length > 1000
  
  if (message.type === 'system') {
    baseImportance = IMPORTANCE_WEIGHTS.systemMessage
    reason = 'system message'
    canCompress = false
  } else if (message.type === 'user') {
    if (hasQuestion) {
      baseImportance = IMPORTANCE_WEIGHTS.userQuestion
      reason = 'user question'
    } else if (hasCodeBlock) {
      baseImportance = IMPORTANCE_WEIGHTS.codeBlock
      reason = 'contains code'
    }
  } else if (message.type === 'assistant') {
    if (hasCodeBlock) {
      baseImportance = IMPORTANCE_WEIGHTS.codeBlock
      reason = 'code response'
    } else if (isLong) {
      baseImportance = IMPORTANCE_WEIGHTS.assistantResponse
      reason = 'detailed response'
    }
  }
  
  const recencyBonus = recencyFactor * 0.2
  const finalImportance = Math.min(1, baseImportance + recencyBonus)
  
  return {
    importance: finalImportance,
    reason,
    canCompress,
  }
}

function getMessageText(message: Message): string {
  if (message.type === 'user' || message.type === 'assistant') {
    const content = message.message.content
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
      return content
        .filter(block => block.type === 'text')
        .map(block => (block as { text: string }).text)
        .join(' ')
    }
  }
  return ''
}

export function getSmartCompactThreshold(
  model: string,
  messages: Message[],
): number {
  const config = getAutoCompactConfig()
  const analysis = analyzeContext(messages)
  
  let thresholdModifier = 1.0
  
  if (analysis.compressionPotential > 0.6) {
    thresholdModifier *= 0.95
  }
  
  if (analysis.redundantContentScore > 0.3) {
    thresholdModifier *= 0.9
  }
  
  if (analysis.averageTokensPerMessage > 500) {
    thresholdModifier *= 1.05
  }
  
  const baseThreshold = config.thresholdPercent
  const adjustedThreshold = baseThreshold * thresholdModifier
  
  logForDebugging(
    `Smart compact threshold: base=${(baseThreshold * 100).toFixed(0)}% adjusted=${(adjustedThreshold * 100).toFixed(0)}% modifier=${thresholdModifier.toFixed(2)}`,
  )
  
  return adjustedThreshold
}

export function shouldTriggerEarlyCompact(
  messages: Message[],
  currentThreshold: number,
): { shouldCompact: boolean; reason: string } {
  const analysis = analyzeContext(messages)
  
  if (analysis.compressionPotential > 0.7 && analysis.redundantContentScore > 0.4) {
    return {
      shouldCompact: true,
      reason: 'High compression potential with redundant content detected',
    }
  }
  
  if (analysis.messageCount > 100 && analysis.averageTokensPerMessage < 200) {
    return {
      shouldCompact: true,
      reason: 'Many small messages detected, compacting for efficiency',
    }
  }
  
  return {
    shouldCompact: false,
    reason: '',
  }
}
