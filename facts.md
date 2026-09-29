# facts.md

> README 的唯一事实来源。A 部分由 AI 扫描生成后人工核对；B 部分必须手写。
> 生成时间：2026-09-29

## A. 可自动提取的事实

1. **项目类型**：Web 应用（Vite + React 单页应用，无后端）
2. **主语言 / 运行时**：
   - TypeScript 5.9.3 / React 19.3.0
   - 实测运行时：Node.js v24.21.0、pnpm 11.7.0
   - `package.json` 无 `engines` 字段，无 `packageManager` 字段
3. **安装命令**：`pnpm install`（来自 `pnpm-lock.yaml`）
4. **运行命令**：`pnpm dev`（来自 `package.json` → `scripts.dev` = `vite`）
5. **测试命令**：无。`package.json` 里没有 `scripts.test`
6. **构建命令**：`pnpm build`（`scripts.build` = `vite build`）
7. **类型检查**：`pnpm typecheck`（`scripts.typecheck` = `tsc --noEmit`）
8. **目录结构**：
   - `src/experiments/` — 每个实验一个目录，自包含
   - `src/lab/` — 实验室外壳（总页面、实验外壳、配色、预览图）
   - `src/styles/` — 全局样式与外壳的配色变量
   - `docs/` — README 用的截图
9. **主要依赖**（10 个）：
   | 包 | 版本 | 用途 |
   |---|---|---|
   | react / react-dom | ^19.3.0 | UI |
   | react-router-dom | ^7.18.4 | 路由 |
   | motion | ^13.4.4 | 动画 |
   | lucide-react | ^1.48.0 | 图标 |
   | tailwindcss + @tailwindcss/vite | ^4.3.3 | 外壳样式 |
   | vite | ^8.3.1 | 构建 |
   | typescript | ^5.9.3 | 类型 |
   | @fontsource-variable/geist | ^5.3.0 | 无衬线 |
   | @fontsource-variable/geist-mono | ^5.3.0 | 等宽 |
   | @fontsource-variable/source-serif-4 | ^5.3.0 | 衬线（007 用） |
   | @fontsource-variable/fraunces | ^5.3.0 | 衬线（001-B 用） |
   | @fontsource-variable/jetbrains-mono | ^5.3.0 | 等宽（003 用） |
10. **环境变量 / 配置项**：**没有**。
    命令：`Select-String -Path 'src\**\*.ts','src\**\*.tsx' -Pattern 'import\.meta\.env|process\.env'` → 命中 0 条
11. **CLI 参数 / 公开 API**：无。这是一个应用，不是库
12. **已有文档**：
    - `README.md` / `README_EN.md`
    - `src/experiments/*/NOTES.md`（12 份，001 至 012）
13. **规模**（命令 → 结果）：
    - `(Get-ChildItem 'src' -Recurse -File).Count` → 76
    - `(Get-ChildItem 'src' -Recurse -File | Get-Content | Measure-Object -Line).Lines` → 11532
    - `(Get-ChildItem 'src\experiments' -Recurse -Filter 'NOTES.md').Count` → 12
    - `(Get-ChildItem 'src\experiments' -Directory).Count` → 11
    - `(Select-String -Path 'src\App.tsx' -Pattern 'path="' -AllMatches).Matches.Count` → 11

## B. 需人工补充

- **一句话描述**（< 120 字符）：Ten standalone interface experiments on how an AI agent's work should look.
  （已写入 `package.json` 的 `description` 字段，与 README 逐字一致）
- **为什么做这个项目**：来自项目作者在本项目对话中的原话，见 README「为什么做这个项目」一节
- **目标用户 / 前置知识**：前端工程师；需要会 React 与 TypeScript
- **与同类方案的差异**：不是组件库，不是设计系统，不是 SDK。十五个模板之间不共享视觉语言
- **已知限制 / 明确不做的事**：全部是 Mock 数据；不接真实 LLM；不做后端、数据库、登录
- **演示素材路径**：`docs/gallery.png`、`docs/007-brief.png`、`docs/008-baseline.png`、`docs/009-workbench.png`、`docs/010-home.png`
- **目标读者画像**：想看不同信息组织方式的前端与设计工程
- **期望读者读完能做什么**：打开线上版或本地跑起来，逐个点开十五个模板，挑一个方向自己接着试

## 核对记录

- [x] 所有命令实际执行过（见上面每条的命令与结果）
- [x] 所有环境变量在代码中能搜到（结论是：一个都没有）
- [x] 目录结构与实际一致
- [x] 无臆造项
- [ ] 许可证：仓库里没有 LICENSE 文件，`package.json` 也没有 `license` 字段，README 里保留 TODO
