# Doge Code

> Claude Code 的增强版 Fork，专注于性能优化和功能扩展

[![Fork](https://img.shields.io/badge/Fork-Claude%20Code-f59e0b)](README.md)
[![Status](https://img.shields.io/badge/status-enhanced%20%2B%20optimized-10b981)](README.md)
[![Runtime](https://img.shields.io/badge/runtime-Bun%20%2B%20Node-3b82f6)](README.md)
[![Config](https://img.shields.io/badge/config-~%2F.doge-8b5cf6)](README.md)
[![License](https://img.shields.io/badge/license-see%20upstream%20notice-lightgrey)](README.md)

![Preview](preview.png)

## 项目简介

Doge Code 是基于 Claude Code 源码树的增强版 Fork，在保留原有功能的基础上，进行了多项性能优化和功能增强。

## 主要特性

### 已禁用遥测
- 完全禁用了所有遥测和分析功能
- 隐私优先，无数据收集

### 增强的自动压缩上下文功能
- 支持三种压缩策略：激进(aggressive)、均衡(balanced)、保守(conservative)
- 可配置压缩阈值百分比
- 智能上下文分析和冗余检测
- 保留最近消息计数配置

### 内存占用优化
- 文件读取缓存优化（从 1000 减少到 200 条目）
- CircularBuffer 循环缓冲区内存管理优化
- 历史记录限制优化（最大 50 条）
- 新增内存管理工具模块，提供：
  - 内存使用监控
  - 自动内存清理
  - 内存健康状态评估

### 自定义配置支持
- 支持自定义 Anthropic 兼容接口地址
- 支持自定义 API Key
- 支持自定义模型与模型列表管理
- 配置数据收口到 `~/.doge` 路径

### Buddy 宠物系统
内置小企鹅宠物，显示在输入框旁边：
- `/buddy` - 启用/唤出 Buddy
- `/buddy pet` - 摸摸 Buddy（爱心动画）
- `/buddy mute` - 静音
- `/buddy unmute` - 恢复显示

## 环境要求

- Bun 1.3.5 或更高版本
- Node.js 24 或更高版本

## 快速安装

```bash
# 克隆仓库
git clone https://github.com/5L8HUB/code.git
cd code

# 安装依赖
bun install

# 注册全局命令
bun link

# 运行
doge
```

## 配置说明

### 自动压缩配置

可通过 `/config` 命令配置：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `autoCompactThreshold` | 压缩阈值百分比 | 85% |
| `autoCompactStrategy` | 压缩策略 | balanced |
| `autoCompactPreserveRecent` | 保留最近消息数 | 10 |

### 策略说明

| 策略 | 阈值 | 缓冲区倍数 | 适用场景 |
|------|------|------------|----------|
| aggressive | 70% | 1.5x | 内存紧张时 |
| balanced | 85% | 1.0x | 日常使用 |
| conservative | 93% | 0.7x | 需要更多上下文时 |

## 更新方式

```bash
git pull
bun install
bun link
```

## 与原版的区别

1. **遥测完全禁用** - 无数据收集
2. **内存优化** - 更低的内存占用
3. **增强的压缩功能** - 更智能的上下文管理
4. **配置隔离** - 使用 `~/.doge` 目录，不与原版冲突

## 免责声明

本项目仅供个人学习与技术研究，不得用于任何商业用途或非法用途。所有原始源码版权归 [Anthropic](https://www.anthropic.com) 所有。

## 许可证

请参阅 LICENSE 文件。
