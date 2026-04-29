import { fileReadCache } from './fileReadCache.js'
import { logForDebugging } from './debug.js'

type MemoryCleanupConfig = {
  aggressive: boolean
  fileCache: boolean
  clearUnused: boolean
}

const DEFAULT_CLEANUP_CONFIG: MemoryCleanupConfig = {
  aggressive: false,
  fileCache: true,
  clearUnused: true
}

let lastMemoryCleanupTime = 0
const MEMORY_CLEANUP_INTERVAL = 5 * 60 * 1000

const registeredCleanupCallbacks: Array<() => void> = []

/**
 * Register a cleanup callback to be called during memory cleanup
 */
export function registerMemoryCleanupCallback(callback: () => void): void {
  registeredCleanupCallbacks.push(callback)
}

/**
 * Get current memory usage statistics
 */
export function getMemoryUsage(): {
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
} {
  const usage = process.memoryUsage()
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Log current memory usage
 */
export function logMemoryUsage(prefix: string = ''): void {
  const usage = getMemoryUsage()
  logForDebugging(`${prefix} Memory Usage: heapUsed=${formatBytes(usage.heapUsed)}, heapTotal=${formatBytes(usage.heapTotal)}, external=${formatBytes(usage.external)}, rss=${formatBytes(usage.rss)}`)
}

/**
 * Perform memory cleanup
 */
export function cleanupMemory(config: Partial<MemoryCleanupConfig> = {}): void {
  const finalConfig: MemoryCleanupConfig = {
    ...DEFAULT_CLEANUP_CONFIG,
    ...config
  }

  const beforeUsage = getMemoryUsage()
  
  if (finalConfig.fileCache) {
    fileReadCache.clear()
    logForDebugging('Cleared file read cache')
  }

  for (const callback of registeredCleanupCallbacks) {
    try {
      callback()
    } catch (error) {
      logForDebugging(`Error during memory cleanup callback: ${error}`)
    }
  }

  if (finalConfig.aggressive) {
    if (global.gc) {
      global.gc()
      logForDebugging('Triggered garbage collection')
    }
  }

  const afterUsage = getMemoryUsage()
  const saved = beforeUsage.heapUsed - afterUsage.heapUsed
  logForDebugging(`Memory cleanup complete. Saved: ${formatBytes(Math.max(0, saved))}`)
}

/**
 * Check if we should perform periodic memory cleanup
 */
export function maybeCleanupMemory(force: boolean = false): void {
  const now = Date.now()
  if (force || now - lastMemoryCleanupTime > MEMORY_CLEANUP_INTERVAL) {
    lastMemoryCleanupTime = now
    cleanupMemory()
  }
}

/**
 * Setup automatic memory monitoring and cleanup
 */
export function setupMemoryMonitoring(): void {
  setInterval(() => {
    maybeCleanupMemory()
  }, MEMORY_CLEANUP_INTERVAL)
  
  logForDebugging('Memory monitoring setup complete')
}

/**
 * Get memory health status
 */
export function getMemoryHealth(): {
  status: 'healthy' | 'warning' | 'critical'
  heapUsedPercent: number
  message: string
} {
  const usage = getMemoryUsage()
  const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100
  
  let status: 'healthy' | 'warning' | 'critical'
  let message: string
  
  if (heapUsedPercent > 90) {
    status = 'critical'
    message = 'Memory usage is critically high'
  } else if (heapUsedPercent > 75) {
    status = 'warning'
    message = 'Memory usage is high'
  } else {
    status = 'healthy'
    message = 'Memory usage is normal'
  }
  
  return {
    status,
    heapUsedPercent,
    message
  }
}
