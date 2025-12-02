# 🎮 自适应学习井字棋（AI 策略与决策思考）

[![Deploy to GitHub Pages](https://github.com/NickScherbakov/tic-tac-toe-ai-battl/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/NickScherbakov/tic-tac-toe-ai-battl/actions/workflows/deploy-pages.yml)

*[English](README.md) ∙ [العربية](README.ar.md) ∙ **简体中文** ∙ [Русский](README.ru.md)*

一个教育性的多阶段井字棋体验，旨在教授策略思维、风险评估、规划与冲动对比，以及概率决策的基础知识。该应用提供两个并行流程（桌面版和移动版），具有相同的教学进程。

## 📚 学习结构（桌面版和移动版）

界面刻意设计为线性，以便每次专注于一个概念：

1. 语言选择 – 认知准备与可访问性。
2. 规则 – 目标、获胜条件、投注作为资源分配隐喻。
3. 练习：人类对战 AI – 主动参与，选择棋盘大小（3×3 / 4×4 / 5×5）以展示模式增长和搜索复杂性。
4. 投注与投资 – 简化的风险/回报，赔率 → 乘数直觉。
5. AI 策略设置 – 比较 4 种思维风格（随机、防守、进攻、计算型/极小极大值）。
6. AI 对战 – 观察、假设形成、反思先前预测（投注结果）。

## 🌐 在线演示

**[立即游玩 → https://nickscherbakov.github.io/tic-tac-toe-ai-battl/](https://nickscherbakov.github.io/tic-tac-toe-ai-battl/)**  
强制移动版流程：添加 `?mobile=1`

## 🧠 教学概念

- 随机（冲动型）→ 说明缺乏规划。
- 防守型 → 安全偏见 / 回避行为。
- 进攻型 → 隧道视野与忽视威胁。
- 计算型（极小极大值）→ 结构化评估与预见性。
- 赔率与支付 → 简化框架中的期望值基础。
- 棋盘缩放（4×4 / 5×5）→ 状态空间的指数增长；为什么深度搜索受到限制。
- 心算小游戏（移动版）→ 工作记忆强化 + 奖励循环。

## 🚀 功能亮点

- 双流程：触摸设备使用 MobileFlow；较大指针使用 DesktopFlow，具有相同的阶段性教学。
- 人类练习模式，可选择棋盘大小（3、4、5）。
- AI 对战 AI 自主对战，带有策略可视化。
- 投注面板（投资与概率的教育框架，包括平局投注）。
- 多语言：英语、俄语、阿拉伯语、中文（简体）。
- 动画、音效（可切换）、支持设备上的触觉脉冲。
- 通过 `useKV` 持久化状态（策略、余额、语言、投注、步骤进度）。

## 🏗️ 技术栈

- Vite 6 + React + TypeScript
- TailwindCSS + 自定义主题渐变组件
- Framer Motion（渐进式揭示与反馈）
- `@github/spark` 钩子用于轻量级持久化状态
- Sonner（提示反馈）用于强化循环

## 📐 游戏逻辑概览

- 动态 `BoardSize`（3 | 4 | 5）→ board = `size * size` 平面数组。
- 获胜检测为每个大小构建组合（行、列、对角线）。
- 平局检测：全部填满且没有获胜线。
- AI 策略共享统一的 `getMove(board, player, size)` 接口。
- 对于较大的棋盘，极小极大值深度减少以保持响应性。

## 🔁 流程

桌面版：`DesktopFlow`（步骤状态存储在 `desktop-step` 下）。  
移动版：`MobileFlow`（启发式触发：视口宽度 < 1024，粗指针或强制 `?mobile=1`）。

`App.tsx` 根据 `useIsTouchMobile()` 选择流程。

## 🏦 投注模型（简化版）

- 投注类型：X、O、平局（平局在内部映射用于赔率解析）。
- 赔率源自所选策略的相对启发式强度。
- 利润 = 支付 − 赌注；跟踪历史记录以进行反思和模式识别。

## 🧪 入门指南

```bash
git clone https://github.com/NickScherbakov/tic-tac-toe-ai-battl
cd tic-tac-toe-ai-battl
npm ci
npm run dev # http://localhost:5173
```

生产构建：

```bash
npm run build
```

测试 / 逻辑检查：

```bash
npm test
```

本地强制移动版流程：

```text
http://localhost:5173/?mobile=1
```

## 📦 部署

通过 Actions 工作流在推送到 `main` 时自动部署到 GitHub Pages。

## 🔐 安全性

- 除了 KV 本地存储抽象外，没有外部数据持久化。
- 不收集个人身份信息。

## 🗺️ 未来增强（想法）

- 练习中的自适应难度（动态策略转换）。
- 极小极大值评估热图的可视化。
- 扩展棋盘大小（6×6）并演示剪枝。
- 自定义场景的期望值计算器。

## 📄 许可证

Spark 模板资产：MIT（版权所有 GitHub, Inc）。  
项目逻辑与教育流程：MIT。

---
享受探索策略思维！如果您发现见解或有改进想法，请随时提出问题。
