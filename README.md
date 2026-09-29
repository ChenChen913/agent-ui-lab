# Agent UI Lab

> 把「Agent 干活的过程」设计出来 —— 一次一个实验。

## 这是什么

一个**个人的 AI Agent 界面实验场**。

不是组件库，不是设计系统，不是 SDK，不是 Agent Runtime。
每个实验是一个独立的小界面，有自己的视觉语言，**不追求彼此统一**。

唯一不变的问题：

**Agent 正在搜索 / 阅读 / 思考 / 犯错 / 改主意的时候，用户看得懂吗？**

## 不是什么

| ❌ 不做 | 原因 |
|---|---|
| Agent Runtime / Framework / SDK | 已经有大量成熟项目，没必要重造 |
| 后端 / 数据库 / 登录 / 支付 | 这个项目只研究界面 |
| 统一 Design System | **恰恰相反**，每个实验允许完全不同的视觉 |
| 真实 LLM 接入 | Mock 剧本足够展示界面，而且更可控 |

## 跑起来

```bash
pnpm install
pnpm dev        # → http://localhost:5273
pnpm build
```

## 目录

```
src/
├─ lab/                     实验室的外围设施（唯一共享的部分）
│  ├─ registry.ts           实验清单
│  ├─ Index.tsx             首页画廊
│  └─ Frame.tsx             实验外壳：返回 / 切换方案 / 播放控制
│
├─ experiments/
│  └─ 001-bench/            001 · The Bench
│     ├─ scenario.ts        ★ 剧本（时间线）—— 改这里 = 改节奏
│     ├─ useBench.ts        ★ 时间线引擎
│     ├─ parts.tsx          计数器 / 进度条工具
│     ├─ NOTES.md           ★ 设计笔记
│     ├─ A-minimal/         方案 A · 极简黑白
│     ├─ B-paper/           方案 B · 暖色纸张
│     └─ C-glass/           方案 C · 冷调玻璃
│
└─ styles/base.css
```

## 四条规矩

1. **一个实验 = 一个文件夹 = 自给自足。** 删掉文件夹 = 干净删掉实验。
2. **实验之间禁止互相 import。** 这条规矩是为了保护「发散」，不是为了复用。
3. **`shared` 遵守三次法则**：同样的东西在 3 个实验里重复了才提上去。提上去之后，各实验自己那份不强制改。
4. **依赖按需引入。** 没到非用不可，不装。

## 视觉怎么共存

每个实验自己管自己的 CSS 变量，挂在实验根节点上：

```css
.ba { --ink: #0a0a0a; --paper: #ffffff; }
.bb { --ink: #2a2622; --paper: #f7f4ee; }
.bc { --ink: #e8ecf2; --bg:    #0b0e14; }
```

所以 10 套完全不同的设计可以在同一个 dev server 里互不干扰。

> Tailwind v4 的 `@theme` 是全局的，**不要拿它存实验级 token**。
> 实验内部可以直接写 CSS —— 有些视觉硬套工具类反而更慢。

## 实验清单

| | 标题 | 问题 | 状态 |
|---|---|---|---|
| 001 | The Bench | Agent 干活的时候，界面除了转圈还能是什么样？ | ✅ 三档方案 |
| 002 | One Line | 如果整个 Agent 只有一行高？ | 待做 |
| 003 | Terminal | 终端可以有多优雅？ | 待做 |
| 004 | Chronicle | 把对话历史做成可以滑动的时间轴。 | 待做 |
| 005 | Desktop | Agent 像操作系统助手一样活着。 | 待做 |
| 006 | Spatial | 不用列表，用空间表达 Agent 的工作。 | 待做 |

## 技术栈

React 19 · TypeScript · Vite · Tailwind CSS v4 · Motion · Lucide · 自托管字体（@fontsource）

**刻意保持简单。** 技术服务于 UI 实验，不是反过来。
