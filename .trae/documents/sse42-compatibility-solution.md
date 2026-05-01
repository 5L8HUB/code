# SSE 4.2 兼容性问题解决方案

## 问题分析

项目中的原生 `.node` 模块可能使用了 SSE 4.2 指令集，导致在不支持的 CPU 上无法运行。

## 原生模块清单

| 模块 | 平台 | SSE 4.2 依赖 | 替代方案 |
|------|------|-------------|---------|
| `audio-capture.node` | 全平台 | 可能依赖 | 可禁用语音功能 |
| `image-processor.node` | 通用 | 可能依赖 | 已有纯 JS 实现 |
| `modifiers-napi` | macOS | 可能依赖 | 已有 fallback |
| `color-diff-napi` | 全平台 | 可能依赖 | ✅ 已有纯 TypeScript 实现 |

## 已有的纯 JS/TS 替代实现

### 1. color-diff (✅ 已完成)
- 位置: `/src/native-ts/color-diff/index.ts`
- 状态: 完整的 TypeScript 实现
- 功能: 语法高亮和 diff 渲染

### 2. modifiers-napi (✅ 已有 fallback)
- 位置: `/vendor/modifiers-napi-src/index.ts`
- 状态: 有 fallback，非 macOS 返回空

### 3. image-processor
- 需要检查是否有纯 JS 替代

## 解决方案

### 方案 A: 使用纯 TypeScript 实现 (推荐)

项目已经有纯 TypeScript 的 `color-diff` 实现，只需确保正确使用：

```typescript
// 当前 shims/color-diff-napi/index.ts 已经指向纯 TS 实现
export {
  ColorDiff,
  ColorFile,
  getSyntaxTheme,
  getNativeModule,
} from '../../src/native-ts/color-diff/index.ts'
```

### 方案 B: 禁用有问题的原生模块

1. **语音功能** - 禁用 `audio-capture.node`
2. **图片处理** - 使用纯 JS 图片处理库
3. **修饰键检测** - 已有 fallback

### 方案 C: 重新编译原生模块

为不支持 SSE 4.2 的 CPU 重新编译：
```bash
# 编译时禁用 SSE 4.2
CFLAGS="-mno-sse4.2" CXXFLAGS="-mno-sse4.2" npm rebuild
```

## 推荐操作

### 步骤 1: 确认问题模块

运行以下命令检查哪个模块导致问题：
```bash
bun run dev
# 或
node --experimental-strip-types ./src/bootstrap-entry.ts
```

### 步骤 2: 禁用或替换问题模块

根据错误信息，针对性处理：
- 如果是 `image-processor.node`: 使用 sharp 或 jimp 替代
- 如果是 `audio-capture.node`: 禁用语音功能
- 如果是 `color-diff`: 已有纯 TS 实现

### 步骤 3: 更新启动脚本

添加 CPU 特性检测，自动选择实现：
```typescript
function hasSSE42(): boolean {
  // 检测 CPU 是否支持 SSE 4.2
  const cpus = os.cpus()
  return cpus[0]?.model.includes('SSE4.2') ?? false
}
```

## 结论

**好消息**: 项目已经有纯 TypeScript 的 `color-diff` 实现，主要问题可能是其他原生模块。

**建议**: 
1. 先确认是哪个模块导致问题
2. 针对性禁用或替换
3. 不需要完全迁移到 Node.js

## 下一步

请告诉我具体的错误信息，我可以帮您：
1. 定位问题模块
2. 提供针对性的解决方案
3. 禁用或替换有问题的原生模块
