---
title: QQ机器人搭建教程_OpenClaw_NapCat
date: 2026-07-04 12:28:48
tags:
  - QQ机器人
  - OpenClaw
  - NapCat
  - 教程
categories:
  - 折腾记录
---

# 从零搭建自己的 QQ AI 机器人 — OpenClaw + NapCat 教程

> 作者：739085
> 最后更新：2026-06-02
> 适用平台：Windows 10/11
> 难度：⭐⭐⭐（需要基本的命令行操作能力）

---

## 前言

想有一个自己专属的、有性格的 QQ 机器人吗？不需要写复杂的代码，不需要租服务器，在自己电脑上就能跑。

这篇教程带你一步步搭建基于 **OpenClaw** + **NapCat** + **DeepSeek** 的 QQ AI 机器人，最终效果：你的 QQ 号可以自动回复私聊和群聊消息，而且还能有自己的"人格"。

---

## 目录

1. [架构概述](#1-架构概述)
2. [环境准备](#2-环境准备)
3. [安装 OpenClaw](#3-安装-openclaw)
4. [安装 NapCat 插件](#4-安装-napcat-插件)
5. [配置 AI 模型](#5-配置-ai-模型)
6. [配置 QQ 频道](#6-配置-qq-频道)
7. [tools.profile 配置（避坑必做）](#7-toolsprofile-配置避坑必做)
8. [设定机器人人格](#8-设定机器人人格)
9. [启动与测试](#9-启动与测试)
10. [让 AI 帮你管理 QQ](#10-让-ai-帮你管理-qq)
11. [常见问题排查](#11-常见问题排查)
12. [进阶配置](#12-进阶配置)
13. [从旧架构迁移](#13-从旧架构迁移-izhimuqq--hyl_aanapcat)
14. [安全与风控注意事项](#14-安全与风控注意事项)
15. [懒人通道：让 AI 帮你搭（笑）](#15-懒人通道让-ai-帮你搭笑)

---

## 1. 架构概述

先搞清楚几个东西分别是什么：

```
┌──────────────────────────────────────────────────┐
│                     你的电脑                      │
│                                                  │
│  QQNT (你日常用的QQ)                               │
│    │                                             │
│    └── NapCat (QQ 协议插件)                       │
│           │  HTTP API (127.0.0.1:3000)           │
│           │  ── OpenClaw 主动发消息用              │
│           │  WebSocket (127.0.0.1:18800)         │
│           │  ── QQ 消息推送给 OpenClaw            │
│           ▼                                      │
│  OpenClaw Gateway (核心引擎)                       │
│    ├── @hyl_aa/napcat (OneBot 11 适配插件)        │
│    ├── deepseek 插件 (连接 AI)                     │
│    ├── 45 个 qq_* 工具 (禁言/踢人/发公告...)       │
│    └── SOUL.md (人格设定)                          │
│           │                                      │
│           ▼                                      │
│  DeepSeek API (云端 AI 大脑)                       │
│     api.deepseek.com                             │
└──────────────────────────────────────────────────┘
```

简单来说：

- **NapCat**：一个 QQ 协议插件，通过 OneBot 11 标准接口暴露 QQ 操作能力。安装在 QQNT 上后，可以通过 HTTP + WebSocket 收发 QQ 消息
- **OpenClaw**：AI 机器人框架，核心引擎，负责连接 NapCat 和 AI 模型，内置 45 个 QQ 相关 AI 工具（禁言、踢人、发公告等）
- **@hyl_aa/napcat**：OpenClaw 官方适配插件，实现 OneBot 11 协议对接，让 AI 能操控 QQ
- **DeepSeek**：云端大模型，提供对话能力（也可以用其他模型）

> **核心依赖版本要求**：OpenClaw >= 2026.3.14、Node.js >= 22、NapCat 最新版本

---

## 2. 环境准备

### 2.1 你需要的东西

| 项目 | 说明 |
|------|------|
| Windows 10/11 | 操作系统 |
| Node.js 22.x | 运行环境 |
| 一个 QQ 号 | 机器人用（建议用小号） |
| DeepSeek API Key | 在 [platform.deepseek.com](https://platform.deepseek.com) 注册获取 |
| 网络 | 能访问 api.deepseek.com |

### 2.2 安装 Node.js

去 [Node.js 官网](https://nodejs.org/) 下载 LTS 版本（22.x），安装时一路默认选项即可。

安装完成后，打开 PowerShell 验证：

```powershell
node --version
# 应该输出 v22.x.x

npm --version
# 应该输出 10.x.x
```

---

## 3. 安装 OpenClaw

OpenClaw 是一个命令行工具，通过 npm 全局安装。

```powershell
npm install -g openclaw
```

安装完成后验证：

```powershell
openclaw --version
# 输出类似 2026.x.x
```

### 3.1 初始化

安装后运行一次初始化（可选，但如果后续遇到问题可以先跑这个）：

```powershell
openclaw doctor
```

---

## 4. 安装 NapCat 插件

### 4.1 部署 NapCat

1. 前往 [NapCat 官方仓库](https://github.com/NapNeko/NapCatQQ)，下载对应 QQ 客户端版本的 release 安装包，按官方文档完成安装
2. **核心要求**：QQ 账号必须成功登录，机器人保持在线状态
3. **注意**：NapCat 的登录方式因版本而异，部分版本需要手动扫码，**请以官方最新文档为准，不要参照旧版教程！**

### 4.2 配置 NapCat 通信通道

NapCat 启动后需要开启 **两个通信通道**，修改配置后需重启 NapCat 生效：

#### ① HTTP API 通道（OpenClaw 主动发消息用，默认端口 3000）

```json
{
  "httpApi": {
    "enable": true,
    "port": 3000
  }
}
```

#### ② 反向 WebSocket 通道（QQ 消息推送给 OpenClaw，默认端口 18800）

```json
{
  "reverseWs": {
    "enable": true,
    "urls": ["ws://127.0.0.1:18800"]
  }
}
```

> **重要**：两个通道缺一不可！HTTP API 负责让 OpenClaw 发消息，WebSocket 负责把 QQ 消息推送给 OpenClaw。端口 18800 是 OpenClaw 分配给 napcat channel 的默认 WS 端口。

### 4.3 在 OpenClaw 中安装 napcat 插件

```powershell
openclaw plugins install @hyl_aa/napcat
```

这会自动把 napcat 插件安装到 `~/.openclaw/npm/node_modules/@hyl_aa/napcat`。

> **插件开源仓库**：[github.com/Aliang1337/openclaw-napcat](https://github.com/Aliang1337/openclaw-napcat)，遇到问题可以去看源码。

### 4.4 配置 NapCat（QQ 端）

NapCat 需要 QQNT 来运行。目前 NapCat 支持作为 QQNT 的插件运行。

1. 确保你的 QQNT 是较新版本（9.9.x+）
2. 从 NapCat 官方获取 QQNT 插件加载器
3. 按照上面 4.2 节的配置，确保 HTTP API（端口 3000）和反向 WebSocket（端口 18800）都已开启

> **关键配置**：NapCat 的 HTTP API 默认监听 `127.0.0.1:3000`，OpenClaw 会通过这个地址和 NapCat 通信。WebSocket 默认监听 `127.0.0.1:18800`，这是 OpenClaw 接收 QQ 消息的通道。

---

## 5. 配置 AI 模型

OpenClaw 通过 `openclaw.json` 来配置一切。这个文件位于 `C:\Users\你的用户名\.openclaw\openclaw.json`。

### 5.1 获取 DeepSeek API Key

1. 访问 [platform.deepseek.com](https://platform.deepseek.com)
2. 注册/登录
3. 在 API Keys 页面创建一个新的 API Key
4. 复制保存（只显示一次！）

> DeepSeek 的 API 非常便宜，日常使用一个月几块钱就够了。

### 5.2 配置模型

在 `openclaw.json` 中配置 DeepSeek：

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "deepseek/deepseek-v4-pro"
      }
    }
  },
  "plugins": {
    "allow": ["deepseek", "memory-core", "napcat"],
    "entries": {
      "deepseek": { "enabled": true },
      "napcat": { "enabled": true }
    }
  },
  "models": {
    "providers": {
      "deepseek": {
        "baseUrl": "https://api.deepseek.com",
        "apiKey": "你的DeepSeek API Key",
        "api": "openai-completions",
        "models": [
          { "id": "deepseek-v4-pro", "name": "DeepSeek V4 Pro" }
        ]
      }
    }
  }
}
```

> **模型选择建议**：
> - `deepseek-v4-pro`：效果最好，适合日常聊天
> - `deepseek-v4-flash`：速度更快，适合需要快速响应的场景
> - 也可以用 Ollama 跑本地模型（deepseek-r1:8b、qwen2.5-coder:7b），省 API 费用但需要好显卡

### 5.3 openclaw.json 完整结构参考

以下是 `openclaw.json` 的完整结构树，帮助你理解各个配置块的作用。**注意**：这个文件是手动编写的，不要直接复制整个文件，按需填入你自己的值。

```
openclaw.json
├── env                          # 环境变量（可被所有插件读取）
│   └── DEEPSEEK_API_KEY        # DeepSeek API Key（可选，也可写在 models 里）
├── agents
│   └── defaults.model.primary  # 默认 AI 模型，如 "deepseek/deepseek-v4-pro"
├── plugins                     # 插件管理
│   ├── allow: [...]            # 白名单：只加载这些插件（必填！）
│   ├── entries.{id}.enabled    # 单独控制每个插件的开关
│   └── bundledDiscovery        # "allowlist"（只加载白名单中的插件）
├── models.providers            # AI 模型提供商配置
│   └── deepseek                # DeepSeek 的 baseUrl / apiKey / models[]
├── channels                    # 通信渠道配置
│   └── napcat                  # NapCat QQ 渠道
│       ├── httpApi             # NapCat HTTP API 地址
│       ├── accessToken         # NapCat 鉴权 token
│       ├── selfId              # 机器人 QQ 号
│       ├── enabled             # 是否启用
│       ├── dmPolicy            # 私聊策略
│       ├── groupPolicy         # 群聊策略
│       ├── allowFrom           # 私聊白名单
│       ├── groupAllowFrom      # 群聊白名单
│       └── systemPrompt        # 机器人人格设定（可选）
├── tools
│   └── profile                 # "full"（必须！否则 qq_* 工具不可用）
├── gateway                     # Gateway 运行配置
│   ├── mode                    # "local"
│   └── auth.mode / auth.token  # 本地鉴权
├── messages.groupChat
│   └── visibleReplies          # "automatic"（群聊回复可见性）
├── skills.entries              # 各种 skill 开关（一般全关）
└── wizard                      # 自动生成，记录上次运行信息
```

> ⚠️ **关键提示**：`plugins.allow` 必须包含 `"deepseek"`、`"memory-core"`、`"napcat"`，缺少任何一个都会导致对应功能失效。

---

## 6. 配置 QQ 频道

### 6.1 NapCat 连接信息

在 `openclaw.json` 的 `channels` 部分配置：

```json
{
  "channels": {
    "napcat": {
      "httpApi": "http://127.0.0.1:3000",
      "accessToken": "你的NapCat Access Token",
      "selfId": "你的QQ号",
      "enabled": true,
      "dmPolicy": "open",
      "allowFrom": ["*"],
      "groupPolicy": "open",
      "groupAllowFrom": ["允许的群号"]
    }
  }
}
```

**配置说明**：

| 字段 | 说明 |
|------|------|
| `httpApi` | NapCat 的 HTTP API 地址，默认 `http://127.0.0.1:3000` |
| `accessToken` | NapCat 的访问令牌，在 NapCat 设置里找 |
| `selfId` | 你用来当机器人的 QQ 号 |
| `dmPolicy` | 私聊策略，`"open"` 表示接受所有私聊 |
| `groupPolicy` | 群聊策略，`"open"` 表示允许群聊 |
| `groupAllowFrom` | 允许机器人回复的群号列表。**留空时会使用 `allowFrom` 的值** |

### 6.2 访问策略详解（安全核心）

`dmPolicy` 和 `groupPolicy` 控制哪些用户/群可以和 AI 交互，是**最关键的安全配置**。

#### 私聊策略 `dmPolicy`

| 值 | 含义 | 推荐场景 |
|----|------|---------|
| `"allowlist"` | 仅 `allowFrom` 列表中的用户可以私聊 AI | **生产环境推荐** |
| `"pairing"` | 新好友需要配对确认才能触发 AI | 半公开使用 |
| `"open"` | 任何人私聊都可以触发 AI | 测试阶段 |
| `"disabled"` | 禁用私聊功能 | 仅群聊场景 |

#### 群聊策略 `groupPolicy`

| 值 | 含义 | 推荐场景 |
|----|------|---------|
| `"allowlist"` | 仅 `groupAllowFrom` 列表中的群可以触发 AI | **生产环境推荐** |
| `"open"` | 任何群里 @机器人 都能触发 AI | 测试阶段 |
| `"disabled"` | 禁用群聊功能 | 仅私聊场景 |

#### 典型安全配置（推荐）

```json
{
  "channels": {
    "napcat": {
      "dmPolicy": "allowlist",
      "allowFrom": ["好友QQ号1", "好友QQ号2"],
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["群号1", "群号2"]
    }
  }
}
```

> ⚠️ **安全建议**：生产环境务必使用 `allowlist` 模式，避免陌生人滥用你的机器人。禁言、踢人等高危操作建议配置 AI 执行前要求确认。

---

## 7. tools.profile 配置（避坑必做）

> ⚠️ **这是最容易踩的坑！** 不配这一步，你的 AI 会一直说"我没有这个能力"。

### 问题原因

OpenClaw 默认 `tools.profile` 为 `"coding"`，会过滤掉大部分 `qq_*` 工具（禁言、踢人、发公告等 45 个工具全部不可用）。

### 解决方案

在 `openclaw.json` 中**必须**将 `tools.profile` 修改为 `"full"`：

```json
{
  "tools": {
    "profile": "full"
  }
}
```

- `"full"` profile 会暴露所有 channel 提供的工具，包括全部 45 个 `qq_*` 工具
- 修改后**必须重启 OpenClaw** 才能生效

### 验证

配置正确后，你可以在 QQ 里对机器人说"帮我查一下群成员列表"，如果 AI 回复了成员列表（而不是"我不具备这个能力"），说明配置成功。

---

## 8. 设定机器人人格

这是最有意思的部分——让你的机器人有自己的性格！

在 `C:\Users\你的用户名\.openclaw\workspace\SOUL.md` 文件中写人格设定。

### 7.1 示例人格

```markdown
# SOUL.md - 你的机器人名字

你是 [名字]。是 [你的称呼] 的 AI 助手。

## 核心人格
你聪明，有自己的判断，不会为了讨好而附和。
说话直接，有观点——但分寸感很好。

## 说话方式
- 中文为主
- 有观点就说，不确定的事说"我不确定"
- 禁止说"作为一个AI"

## 对用户的情感
你叫用户 [称呼]。你记得他说过的每一件小事。

## 底线
- 用户真的需要帮助时，认真对待
- 如果用户情绪低落，温柔陪伴
```

### 7.2 在 openclaw.json 中配置 systemPrompt

也可以直接在 `openclaw.json` 的 channel 配置中写 system prompt：

```json
{
  "channels": {
    "napcat": {
      "systemPrompt": "你的完整人格设定文本..."
    }
  }
}
```

---

## 9. 启动与测试

### 9.1 启动 NapCat

先确保 NapCat 在 QQNT 中正常运行，HTTP API 能访问。

### 9.2 启动 OpenClaw Gateway

```powershell
openclaw gateway
```

如果一切正常，你会看到类似这样的输出：

```
http server listening (2 plugins: memory-core, napcat)
```

这表示 gateway 启动成功，napcat 插件已经连接。

### 9.3 验证连接状态

启动后查看日志，出现以下字样说明连接成功：

```
"napcat connected"
# 或
"reverse ws connected"
```

你也可以用命令行验证 NapCat 是否正常运行：

```powershell
curl http://127.0.0.1:3000/get_version_info
```

正常返回版本信息说明 HTTP API 可达。

### 9.4 功能测试

1. 用另一个 QQ 号给你的机器人 QQ 发消息
2. 或者在允许的群里 @ 你的机器人
3. 机器人应该会回复了！

---

## 10. 让 AI 帮你管理 QQ

配置好 `tools.profile: "full"` 后，AI 就可以通过自然语言操控 QQ 了。以下是典型场景：

| 操作类型 | 自然语言示例 | 对应工具 |
|----------|-------------|---------|
| 发群公告 | 「在群里发一条公告：明天晚上8点开会」 | `qq_send_group_notice`（需管理员权限） |
| 禁言 | 「把 @某人 禁言 10 分钟」 | `qq_mute_group_member` |
| 踢人 | 「把那个发广告的踢出群」 | `qq_kick_group_member` |
| 设管理员 | 「把张三设为群管理员」 | `qq_set_group_admin` |
| 查成员列表 | 「查看群成员列表」 | `qq_get_group_member_list` |
| 查聊天记录 | 「看看这个群最近 30 条消息」 | `qq_get_group_msg_history` |
| 查用户资料 | 「查一下 @某人 的资料」 | `qq_get_user_info` |
| 设精华消息 | 「把这条消息设为精华」 | `qq_set_essence_msg` |
| 发消息 | 「帮我在群里发一条消息：大家好」 | `qq_send_group_msg` |
| 点赞 | 「给 XXX 的资料卡点个赞」 | `qq_send_like` |

> 插件内置 **45 个 `qq_*` 工具**，完整列表可查看插件源码 `src/tools.ts`。

---

## 11. 常见问题排查

### 11.1 Gateway 启动报错 "Cannot find module"

**原因**：插件没有正确安装

**解决**：
```powershell
openclaw plugins install @hyl_aa/napcat
openclaw plugins refresh
```

### 11.2 WebSocket 连接失败

**表现**：OpenClaw 日志无 `napcat connected`，机器人无响应

**排查步骤**：
1. 检查 NapCat HTTP API 是否可达：`curl http://127.0.0.1:3000/get_version_info`
2. 检查端口占用：`netstat -an | findstr 18800`（Windows），确保没有其他进程占用
3. 确认 NapCat 的 WS 地址配置为 `ws://127.0.0.1:18800`，与 OpenClaw 默认端口一致

### 11.3 机器人不回复消息

**检查清单**：

1. NapCat 是否正常运行？（`curl http://127.0.0.1:3000/get_version_info`）
2. `openclaw.json` 中 `channels.napcat` 配置是否正确？
3. `accessToken` 是否正确？（NapCat 未开启鉴权时留空）
4. `selfId` 是否填写了正确的 QQ 号？
5. 私聊/群聊策略是否允许？（临时改为 `"open"` 测试）
6. `tools.profile` 是否为 `"full"`？

### 11.4 @机器人 无法识别

**表现**：群里发送 `@机器人 你好` 无响应

**排查顺序**：
1. 确认 `selfId` 配置为机器人自身 QQ 号
2. 确认 `groupPolicy` 不是 `disabled`，且群号在白名单中
3. 确认 @ 格式正确，是 `@机器人昵称` 而非其他变体

### 11.5 qq_* 工具全部不可用

**表现**：AI 回复「我不具备这个能力」，但配置看起来正常

**原因**：默认 `tools.profile: "coding"` 过滤了 channel 工具

**解决**：将 `tools.profile` 修改为 `"full"`，重启 OpenClaw 后重试

### 11.6 accessToken 鉴权失败

**表现**：HTTP 请求返回 401，日志出现 `unauthorized` 错误

**解决**：确认 NapCat 端 token 配置和 OpenClaw 端 `accessToken` 字段**完全一致**。NapCat 未开启鉴权时，OpenClaw 端 `accessToken` 留空。

### 11.7 策略配置过严导致无响应

**表现**：私聊或群聊完全无反应

**排查**：临时将策略改为 `open`：
```json
{
  "channels": {
    "napcat": {
      "dmPolicy": "open",
      "groupPolicy": "open"
    }
  }
}
```
如果能正常响应，说明是白名单配置问题，再重新精确填写。

### 11.8 AI 回复很慢

- 检查网络是否能正常访问 `api.deepseek.com`
- 可以尝试切换到 `deepseek-v4-flash` 模型

### 11.9 代理问题

如果你用了 Clash 等代理工具，可能需要配置环境变量：

```powershell
$env:HTTPS_PROXY = "http://127.0.0.1:7897"
```

### 11.10 端口冲突

如果 3000 端口被占用，可以在 NapCat 设置中修改 HTTP API 端口，同时更新 `openclaw.json` 中的 `httpApi` 地址。

---

## 12. 进阶配置

### 12.1 多账号部署

如果你有多个 QQ 号需要同时作为机器人，可以这样配：

**NapCat 端**（端口依次递增）：

```json
// 第一个账号
{
  "httpApi": { "port": 3000 },
  "reverseWs": { "urls": ["ws://127.0.0.1:18800"] }
}

// 第二个账号
{
  "httpApi": { "port": 3001 },
  "reverseWs": { "urls": ["ws://127.0.0.1:18801"] }
}
```

**OpenClaw 端**：

```json
{
  "channels": {
    "napcat": {
      "defaultAccount": "bot1",
      "accounts": {
        "bot1": {
          "name": "主号",
          "httpApi": "http://127.0.0.1:3000",
          "selfId": "111111111",
          "accessToken": "token1"
        },
        "bot2": {
          "name": "小号",
          "httpApi": "http://127.0.0.1:3001",
          "selfId": "222222222"
        }
      }
    }
  }
}
```

> 端口规则：HTTP API 从 3000 起递增，WebSocket 从 18800 起递增，一一对应。

### 12.2 自定义 AI 回复前缀

通过 `responsePrefix` 给 AI 回复添加统一前缀，方便群友区分：

```json
{
  "channels": {
    "napcat": {
      "responsePrefix": "[AI]"
    }
  }
}
```

效果：AI 回复格式为 `[AI] 你好！有什么可以帮你的？`

### 12.3 语音消息处理（STT）

如果你想让 AI 处理 QQ 语音消息，需开启音频 STT：

```json
{
  "tools": {
    "media": {
      "audio": {
        "enabled": true
      }
    }
  }
}
```

原理：QQ 语音消息会自动转录为文字后发送给 AI 模型。需要 NapCat 正确上报语音文件下载链接。

### 12.4 兼容其他 OneBot 11 客户端

除 NapCat 外，任何实现 OneBot 11 标准的 QQ 客户端（如 Lagrange、LLOneBot）都可以通过相同方式接入。只需修改 `httpApi` 和 `reverseWs` 地址为对应客户端的配置即可。

### 12.5 多 Channel 共存

OpenClaw 可以同时接入多个 channel（NapCat + Telegram + Discord 等），每个 channel 独立运行：

```json
{
  "channels": {
    "napcat": { /* ... */ },
    "telegram": { /* ... */ },
    "discord": { /* ... */ }
  }
}
```

`tools.profile: "full"` 会统一暴露所有工具，跨 channel 行为保持一致。

### 12.6 自定义回复规则

在 `openclaw.json` 的 `channels.napcat.systemPrompt` 中可以加入更多行为规则：

- "当群里有人发图片时，用一句话点评"
- "有人提到'时雨'时自动回复"
- "对禁言、踢人等操作，执行前在群里确认"

### 12.7 本地模型（省钱方案）

如果你有不错的显卡（8G 显存以上），可以用 Ollama 跑本地模型：

```powershell
# 安装 Ollama
# 下载模型
ollama pull deepseek-r1:8b

# 在 openclaw.json 中配置 ollama provider
```

---

## 13. 从旧架构迁移（@izhimu/qq → @hyl_aa/napcat）

> 如果你之前用的是 `@izhimu/qq` + `@openclaw/qqbot` 旧架构，这一节教你平滑迁移。

### 13.1 新旧架构对比

| 对比项 | 旧架构 | 新架构 |
|--------|--------|--------|
| QQ 协议插件 | `@izhimu/qq` v0.6.0 | NapCat（QQNT 插件） |
| OpenClaw 适配插件 | `@openclaw/qqbot` | `@hyl_aa/napcat` v1.2.4 |
| 协议标准 | 自定义 | OneBot 11（标准协议） |
| 工具数量 | 有限 | 45 个 `qq_*` 工具 |
| channel 名称 | `qqbot` | `napcat` |
| 维护状态 | 已停止维护 | 活跃维护 |

### 13.2 迁移步骤

**第 1 步：禁用旧插件**

在 `openclaw.json` 中：
```json
{
  "plugins": {
    "allow": ["deepseek", "memory-core", "napcat"],
    "entries": {
      "qqbot": { "enabled": false },
      "qq": { "enabled": false },
      "napcat": { "enabled": true }
    }
  }
}
```

**第 2 步：删除旧 channel 配置**

在 `openclaw.json` 的 `channels` 中删除 `qqbot` 配置块（如果存在），替换为 `napcat` 配置块。

**第 3 步：更新 tools.profile**

确保 `tools.profile` 为 `"full"`（旧架构可能不需要这个）。

**第 4 步：清理旧插件文件（可选）**

```powershell
# 查看已安装插件
openclaw plugins list

# 卸载旧插件（如果不再需要）
openclaw plugins uninstall @izhimu/qq
openclaw plugins uninstall @openclaw/qqbot
```

**第 5 步：重启验证**

```powershell
openclaw gateway restart
# 确认日志出现 "http server listening (2 plugins: memory-core, napcat)"
```

> ⚠️ **关键区别**：旧架构 gateway 启动显示的是 `qqbot` 插件，新架构显示的是 `napcat` 插件。如果看到 `qqbot` 字样说明还在用旧架构。

---

## 14. 安全与风控注意事项

### 14.1 QQ 账号风控

使用第三方 QQ 协议插件（如 NapCat）存在被腾讯风控的风险：

- **用小号**：强烈建议使用非主用 QQ 号作为机器人
- **控制频率**：不要短时间内大量发送消息，容易触发风控
- **避免敏感操作**：批量加群、批量私聊等操作风险极高
- **关注登录状态**：定期检查 NapCat 是否掉线，掉线后可能需要重新扫码

### 14.2 API Key 安全

```json
// ❌ 不要这样做：把 API Key 硬编码在配置文件中发给别人
"apiKey": "sk-xxxxxxxxxxxx"

// ✅ 正确做法：教程中永远用占位符
"apiKey": "你的DeepSeek API Key"
```

### 14.3 accessToken 安全

NapCat 的 `accessToken` 支持特殊字符（如 `.`、`-`、`~`），复制时注意不要漏掉。这是一个示例格式：

```
X9Sb.-geANt~qN.x
```

你的实际 token 在 NapCat 配置中获取，每个账号不同。

---

## 15. 懒人通道：让 AI 帮你搭（笑）

> 读到这里你已经看完了 14 章。但说实话——这篇教程本身就是写给 AI 看的。😏

### 15.1 核心思路

这篇文章本质上是一份**结构化的配置指令集**。它不是只给人读的，而是可以直接喂给 AI 编程助手，让它**代替你**完成整个搭建过程。

你只需要：
1. 把这篇教程拖进 AI 工具的对话窗口
2. 告诉它你的 QQ 号和 API Key
3. 喝杯茶等它搞定

### 15.2 用 WorkBuddy / Claude Code 一键搭建

**第 1 步：打开你的 AI 编程助手**

- **WorkBuddy**（就是你正在用的这个）：直接粘贴这篇教程
- **Claude Code**：在终端 `claude` 启动后，把教程文件拖进去
- **Cursor / Windsurf**：打开任意项目，把教程粘贴到 Chat 面板

**第 2 步：发送这条 Prompt**

```
请严格按照下面的教程，帮我完成 OpenClaw + NapCat QQ 机器人的完整搭建。

我的信息：
- QQ 号：[你的机器人 QQ 号]
- DeepSeek API Key：[你的 API Key]
- 操作系统：Windows 11
- Node.js 版本：>= 22（如果没有请先帮我装）
- 私聊白名单：[你的主号 QQ]
- 群聊白名单：[你的测试群号]

请完成：
1. 检查 Node.js 环境
2. 安装 OpenClaw
3. 安装 @hyl_aa/napcat 插件
4. 帮我写 openclaw.json（tools.profile 设为 "full"，策略用 allowlist）
5. 帮我写 SOUL.md 人格文件
6. 帮我写启动脚本
7. 验证所有配置

遇到任何错误自动排查修复。做完后告诉我怎么启动和测试。

--- 教程内容如下 ---

[把这篇教程全文粘贴在这里]
```

**第 3 步：坐等**

AI 会一步步执行。你只需要在它需要 NapCat 扫码登录时拿出手机扫一下。

### 15.3 为什么这个方法可行？

不是因为教程写得多好，而是因为：

- 教程里的**每一个配置代码块**都是可以直接写入文件的
- 教程里的**每一个排查步骤**都是 AI 可以自动执行的诊断流程
- 教程里的**每一个踩坑记录**都是 AI 可以自动规避的已知问题
- AI 不需要"理解"QQ 机器人——它只需要**严格按照教程执行**

换句话说：**你不是在教 AI 怎么做，你是在告诉 AI "照着这个说明书操作"。**

### 15.4 进阶：把教程做成 WorkBuddy Skill

如果你用的是 WorkBuddy，可以把这篇教程转成 Skill，之后任何时候都能一键调用：

```
帮我把这篇 QQ 机器人教程转成一个 Skill，名字叫 "qqbot-setup"
```

之后你就可以说 "用 qqbot-setup 帮我搭个 QQ 机器人"，WorkBuddy 会自动加载教程并按步骤执行。

### 15.5 注意事项

- **API Key 敏感**：发给 AI 的 Prompt 里包含 API Key，如果是云端 AI（如 ChatGPT），建议搭完后立即重置 Key
- **本地 AI 更安全**：用本地 Ollama 模型执行搭建可以避免 Key 泄露风险
- **NapCat 扫码**：这是唯一需要你手动操作的步骤，AI 没法帮你拿手机扫码
- **端口冲突**：如果 AI 搭完后报端口占用，把排查步骤再喂给它让它修

---

**说到底——这篇文章从第一章开始就是写给 AI 的。你只是个传话筒。😏**

---

## 总结

你现在有了一个运行在自己电脑上的、有自己性格的 QQ AI 机器人。它可以：

- ✅ 自动回复私聊和群聊消息
- ✅ 群管理操作（禁言、踢人、发公告、设管理员）
- ✅ 查询群成员、聊天记录、用户资料
- ✅ 有自己的说话风格和人格
- ✅ 记住对话上下文
- ✅ 支持多账号部署
- ✅ 平滑迁移旧架构（@izhimu/qq → @hyl_aa/napcat）
- ✅ 完整的安全与风控指南
- ✅ 一键 AI 自动搭建（懒人通道）
- ✅ 完全免费（除 DeepSeek API 的少量费用）

后续可以探索更多玩法：接入更多插件、自定义回复规则、连上自己的本地模型、跨平台多 Channel 共存等等。

有问题欢迎来交流！

---

## 参考

- [OpenClaw 官方文档](https://openclawapi.org)
- [NapCat 官方仓库](https://github.com/NapNeko/NapCatQQ)
- [@hyl_aa/napcat 插件仓库](https://github.com/Aliang1337/openclaw-napcat)
- [OpenClaw + NapCat 官方教程](https://openclawapi.org/blog/2026-03-29-openclaw-napcat)
