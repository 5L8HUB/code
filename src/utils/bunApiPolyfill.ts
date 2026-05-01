/**
 * Bun API polyfill
 * 在 Node.js 环境下提供 Bun API 的替代实现
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn, spawnSync } from 'child_process'

// 判断是否在 Bun 环境下
const isBun = typeof Bun !== 'undefined'

// 获取当前模块目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 全局 Bun polyfill
if (!isBun) {
  console.log('[Doge Code] Loading Bun polyfills for Node.js...')
  
  // 安全地保存原始 console
  const safeGlobal: any = globalThis
  safeGlobal._originalConsole = {
    log: console.log
  }
  
  // 构建 Bun 对象
  const BunPolyfill: any = {}
  
  // hash 函数
  BunPolyfill.hash = (content: string | Uint8Array, seed?: number): string | number => {
    const crypto = require('crypto')
    if (typeof content === 'string') {
      if (seed !== undefined) {
        const h = crypto.createHash('sha256')
        h.update(seed.toString())
        h.update(content)
        return h.digest('hex')
      }
      return crypto.createHash('sha256').update(content).digest('hex')
    }
    return crypto.createHash('sha256').update(Buffer.from(content)).digest('hex')
  }

  // which 函数
  BunPolyfill.which = (command: string): string | null => {
    const { whichSync } = require('./which.js')
    return whichSync(command)
  }

  // stringWidth 函数
  BunPolyfill.stringWidth = (text: string): number => {
    const { stringWidth } = require('../ink/stringWidth.js')
    return stringWidth(text)
  }

  // wrapAnsi 函数
  BunPolyfill.wrapAnsi = (text: string, columns: number, options: any = {}): string => {
    const wrap = require('../ink/wrapAnsi.js')
    return wrap.wrapAnsi(text, columns, options)
  }

  // file 函数
  BunPolyfill.file = (filePath: string) => {
    return {
      text: async () => fs.promises.readFile(filePath, 'utf-8'),
      arrayBuffer: async () => fs.promises.readFile(filePath),
      json: async () => JSON.parse(await fs.promises.readFile(filePath, 'utf-8')),
      size: async () => (await fs.promises.stat(filePath)).size,
      exists: async () => {
        try {
          await fs.promises.access(filePath)
          return true
        } catch {
          return false
        }
      },
      writer: () => {
        return {
          write: (data: any) => fs.promises.writeFile(filePath, data),
          end: () => {}
        }
      }
    }
  }

  // listen 函数 - 回退到 Node net
  BunPolyfill.listen = (options: any) => {
    const net = require('net')
    const server = net.createServer(options.socket || options.socketOptions)
    
    if (options.hostname) {
      server.listen(options.port, options.hostname)
    } else {
      server.listen(options.port)
    }
    
    return server
  }

  // spawn/spawnSync 函数
  BunPolyfill.spawnSync = (options: any) => {
    const { cmd, stdout, stderr, ...spawnOpts } = options
    let command = cmd
    let args: string[] = []
    
    if (Array.isArray(cmd)) {
      command = cmd[0]
      args = cmd.slice(1)
    }

    const child = spawnSync(command, args, {
      ...spawnOpts,
      encoding: stdout === 'pipe' || stderr === 'pipe' ? 'utf-8' : undefined
    })
    
    const result: any = {
      exitCode: child.status ?? 0,
      signalCode: child.signal ?? null,
      success: child.status === 0
    }
    
    if (stdout === 'pipe') {
      result.stdout = child.stdout
    }
    
    if (stderr === 'pipe') {
      result.stderr = child.stderr
    }
    
    return result
  }

  BunPolyfill.spawn = (options: any) => {
    const { cmd, stdout, stderr, ...spawnOpts } = options
    let command = cmd
    let args: string[] = []
    
    if (Array.isArray(cmd)) {
      command = cmd[0]
      args = cmd.slice(1)
    }

    const child = spawn(command, args, {
      ...spawnOpts,
      encoding: stdout === 'pipe' || stderr === 'pipe' ? 'utf-8' : undefined
    })
    
    const promise = new Promise((resolve) => {
      const result: any = {
        exitCode: 0,
        signalCode: null,
        success: true
      }
      
      let stdoutBuf = ''
      let stderrBuf = ''
      
      if (stdout === 'pipe' && child.stdout) {
        child.stdout.on('data', (data) => {
          stdoutBuf += data
        })
      }
      
      if (stderr === 'pipe' && child.stderr) {
        child.stderr.on('data', (data) => {
          stderrBuf += data
        })
      }
      
      child.on('close', (code, signal) => {
        result.exitCode = code ?? 0
        result.signalCode = signal ?? null
        result.success = code === 0
        
        if (stdout === 'pipe') {
          result.stdout = stdoutBuf
        }
        
        if (stderr === 'pipe') {
          result.stderr = stderrBuf
        }
        
        resolve(result)
      })
    })
    
    return {
      stdin: child.stdin,
      stdout: child.stdout,
      stderr: child.stderr,
      exited: promise,
      pid: child.pid,
      kill: (signal?: string) => child.kill(signal)
    }
  }

  // gc 函数
  BunPolyfill.gc = (options?: any) => {
    try {
      if (global.gc) {
        global.gc()
      }
    } catch {
      // Ignore errors
    }
  }

  // generateHeapSnapshot
  BunPolyfill.generateHeapSnapshot = (format: string = 'v8', options?: any) => {
    try {
      const v8 = require('v8')
      const snapshot = v8.getHeapSnapshot()
      const chunks: Buffer[] = []
      
      return new Promise((resolve, reject) => {
        snapshot.on('data', (chunk) => {
          chunks.push(chunk)
        })
        
        snapshot.on('end', () => {
          if (options === 'arraybuffer') {
            const buf = Buffer.concat(chunks)
            resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
          } else {
            resolve(Buffer.concat(chunks).toString())
          }
        })
        
        snapshot.on('error', reject)
      })
    } catch {
      return Promise.resolve('')
    }
  }

  // semver
  BunPolyfill.semver = {
    order: (a: string, b: string): number => {
      const semver = require('semver')
      return semver.compare(a, b) as number
    },
    satisfies: (version: string, range: string): boolean => {
      const semver = require('semver')
      return semver.satisfies(version, range)
    }
  }

  // embeddedFiles
  BunPolyfill.embeddedFiles = []
  
  // 赋值给全局
  safeGlobal.Bun = BunPolyfill
}

export { isBun }
export default isBun
