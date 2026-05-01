
# Node.js 兼容性全面检查计划

## 概述
本计划旨在全面验证本项目在 Node.js 环境下的所有功能是否正常工作，确保所有使用 Bun 特有 API 的地方都有正确的回退实现。

## 检查清单

### 1. 基础运行时检测和启动
- [ ] `src/bootstrap-entry.ts` 入口文件在 Node.js 环境下正常启动
- [ ] `src/utils/bundledMode.ts` 检测函数工作正常
- [ ] `npm run version:node` 显示正确版本号
- [ ] 完整应用启动无错误

### 2. 工具函数和 API 兼容性

#### 2.1 Hash 函数 (`src/utils/hash.ts`)
- [ ] Bun 环境下使用 Bun.hash
- [ ] Node.js 环境下使用 Node crypto 模块
- [ ] 两个环境下输出兼容

#### 2.2 Which 命令 (`src/utils/which.ts`)
- [ ] Bun 环境下使用 Bun.which
- [ ] Node.js 环境下正确使用 exec 和 which 命令

#### 2.3 ANSI 字符串处理
- [ ] `src/ink/stringWidth.ts` 宽度计算兼容
- [ ] `src/ink/wrapAnsi.ts` 换行处理兼容

#### 2.4 YAML 解析 (`src/utils/yaml.ts`)
- [ ] Bun 环境下使用 Bun.YAML
- [ ] Node.js 环境下使用 npm yaml 包

#### 2.5 JSONL 解析 (`src/utils/json.ts`)
- [ ] Bun 环境下使用 Bun.JSONL.parseChunk
- [ ] Node.js 环境下使用 indexOf 逐行扫描

#### 2.6 Semver 比较 (`src/utils/semver.ts`)
- [ ] Bun 环境下使用 Bun.semver
- [ ] Node.js 环境下使用 npm semver 包

### 3. 进程和 Shell 相关

#### 3.1 Shell 执行 (`src/utils/Shell.ts`)
- [ ] Bun 和 Node.js 环境下都能正确执行命令
- [ ] 沙箱模式工作正常

#### 3.2 上游代理 (`src/upstreamproxy/relay.ts`)
- [ ] Bun 环境下使用 Bun.listen
- [ ] Node.js 环境下使用 Node net.createServer
- [ ] WebSocket 代理正常工作

### 4. 代理和 HTTP (`src/utils/proxy.ts`)
- [ ] Bun 环境下使用 Bun.fetch 的 proxy 选项
- [ ] Node.js 环境下使用 undici 的 dispatcher
- [ ] 两个环境下 mTLS 配置都正常

### 5. 计算机使用功能 (`src/utils/computerUse/`)

#### 5.1 Linux 平台 (`linux.ts`)
- [ ] Bun.spawnSync 在 Node.js 环境下的回退（需要修复）
- [ ] xdotool 相关命令在 Node 下正常
- [ ] 截图功能在 Node 下正常
- [ ] 需要将 Bun.spawnSync/spawn 替换为 Node 的 child_process

### 6. 堆转储功能 (`src/utils/heapDumpService.ts`)
- [ ] Bun 环境下使用 Bun.generateHeapSnapshot
- [ ] Node.js 环境下使用 Node v8 module
- [ ] 两个环境下都能正确写入堆转储文件

### 7. 伴生宠物功能 (`src/buddy/companion.ts`)
- [ ] 随机数生成正常
- [ ] hashString 函数在两个环境下都工作

### 8. 打包和模块系统
- [ ] `bun:bundle` 模块在 Node.js 下被正确替换

## 发现的问题和需要修复的地方

### 主要问题
1. **`src/utils/computerUse/platforms/linux.ts`** - 使用了 Bun.spawn 和 Bun.spawnSync，没有 Node 回退
2. **Windows 计算机使用相关文件** - 同样使用 Bun API，需要检查

### 修复策略
1. 创建统一的 spawn 工具函数，根据环境自动选择
2. 在入口处添加完整的 Bun API polyfill
3. 确保所有功能在两个环境下都能正常工作

## 测试步骤

### 第一阶段：快速测试
1. 运行 `npm run version:node` 验证基本功能
2. 运行 `npm run dev:node` 验证完整启动

### 第二阶段：详细验证
逐个检查以上清单中的功能，确保都能正常工作。

### 第三阶段：集成测试
运行完整的应用流程，确保所有功能集成正常。

## 总结
本项目已经有非常完整的 Node.js 兼容性支持，绝大多数功能都有对应的回退实现。只有少数几个角落需要完善，主要是计算机使用（Computer Use）功能在 Node.js 环境下的适配。
