/**
 * Bun API polyfill
 * 在 Node.js 环境下提供 Bun API 的替代实现
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 判断是否在 Bun 环境下
const isBun = typeof Bun !== 'undefined'

// 获取当前模块目录
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 全局 Bun polyfill
if (!isBun) {
  (globalThis as any).Bun = {
    // hash 函数
    hash: (content: string | Uint8Array, seed?: number): string | number => {
      // 使用 Node crypto 替代
      const crypto = require('crypto')
      if (typeof content === 'string') {
        if (seed !== undefined) {
          // Seeded hash
          const h = crypto.createHash('sha256')
          h.update(seed.toString())
          h.update(content)
          return h.digest('hex')
        }
        return crypto.createHash('sha256').update(content).digest('hex')
      }
      return crypto.createHash('sha256').update(content).digigest('hex')
    },

    // which 函数
    which: (command: string): string | null => {
      // 这已有回退实现在 utils/which.ts
      // 简单实现
      const { whichSync } = require('./which.js')
      return whichSync(command)
    },

    // stringWidth 函数
    stringWidth: (text: string): number => {
      // 使用纯 JS 回退
      const { stringWidth } = require('../ink/stringWidth.js')
      return stringWidth(text)
    },

    // wrapAnsi 函数
    wrapAnsi: (text: string, columns: number, options: any = {}): string => {
      // 简单回退：使用字符串切片
      const wrap = require('../ink/wrapAnsi.js')
      return wrap.wrapAnsi(text, columns, options)
    },

    // file 函数
    file: (filePath: string) => {
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
    },

    // listen 函数 - 回退到 Node net
    listen: (options: any) => {
      const net = require('net')
      const server = net.createServer(options.socket || options.socketOptions)
      
      if (options.hostname) {
        server.listen(options.port, options.hostname)
      } else {
        server.listen(options.port)
      }
      
      return server
    },

    // embeddedFiles - 在 Node 下返回空数组
    embeddedFiles: []
  }
}

export { isBun }
export default isBun

