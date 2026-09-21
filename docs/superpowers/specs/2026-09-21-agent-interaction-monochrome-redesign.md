# Campaign Agent：确定性交互与黑白编辑式界面修订规格

日期：2026-09-21  
状态：已确认

## 1. 修订目标

本次修订解决三个已复现问题：

1. 用户输入“先只整理 Brief”后，系统只追加确认文案，没有修改 Run 目标、步骤和后续动作，导致对话与真实状态脱节。
2. 全局显示“为什么推荐他”等需要候选人上下文的快捷词；没有选中候选人时解析必然失败，却返回通用英文边界说明。
3. Agent 的领域状态在一次同步更新中立即完成，没有 working、步骤推进、结果出现等中间反馈；同时大量 7–10px 字号、米灰/蓝/荧光绿混用降低可读性并削弱专业感。

目标不是伪装在线大模型，而是在固定骑行头戴摄像头 Campaign 内，提供状态一致、数据可查、上下文相关且有自然过程感的确定性 Agent。

## 2. 产品原则

- 每条 Agent 回复必须对应真实状态变化、真实数据查询，或明确的下一步建议。
- 快捷操作必须在当前阶段可执行；需要上下文的命令只在对应上下文中出现。
- 用户可以在运行中缩小范围；修改范围必须生成可见的 Revised Plan，并改变 Run Steps。
- 动画表达真实处理阶段，不用长时间等待伪装模型推理。
- 视觉只使用黑、白、灰；层级依靠排版、留白、线条、反白和字重，而不是彩色标签。
- 正文与操作优先可读，不以极小字号营造信息密度。

## 3. 确定性意图与上下文

### 3.1 意图路由结果

意图解析器返回结构化结果，而不是仅返回一个类型：

```ts
interface IntentResolution {
  intent: AgentIntent;
  confidence: "Exact" | "Alias" | "Fallback";
  requiredContext: "None" | "Candidate" | "Artifact" | "Decision";
  available: boolean;
  suggestions: string[];
}
```

解析依据包含：标准化文本、当前 Run 状态、当前 Step、选中的 Artifact、候选人上下文和待处理 Decision。支持中英文空格、大小写与常见标点差异，以及固定同义表达。

### 3.2 阶段覆盖

| 阶段 | 可执行意图 |
|---|---|
| Intake / Planned | 分析材料、只整理 Brief、查看执行计划 |
| Brief decisions | 采用 Agent 建议、选择具体选项、查看冲突来源、查询预算/周期/市场/目标/证据要求、只完成 Brief |
| Brief completed | 打开 Brief、继续完整计划、查看下一步 |
| Mix | 比较两个方案、解释推荐、测试失败、恢复方案、锁定 Matrix、生成搜索包 |
| Calibration | 解释候选人、找同单元格相似候选人、按固定原因拒绝、批准校准 |
| Review | 校验 30+10、打开 Client Preview、发布 Round 1、应用模拟反馈 |
| Gap recovery | 解释缺口、晋升 Backup、创建局部补量、查看未受影响 Artifact |
| 通用 | 当前进度、下一步、打开已有 Artifact、查询 Campaign 固定事实 |

无匹配输入不再输出通用英文错误，而是用中文说明当前阶段、缺少的上下文和 2–4 个当前可执行建议。

### 3.3 动态快捷操作

Composer 的 chips 由 `availableActions(state, context)` 生成：

- 无候选人上下文时不出现“为什么推荐他”和“找相似人”。
- 决策阶段显示“采用建议”“查看来源”“先只整理 Brief”。
- Brief scoped Run 完成后显示“打开 Brief”“继续完整计划”。
- 每次只显示最多四个最相关动作，避免把所有能力堆在输入框上方。

## 4. 运行中修改计划

用户在任意未完成阶段输入“先只整理 Brief”时：

1. 保留已完成的读取、标准化步骤和当前未解决 Decision。
2. 将 Run goal 改为“从 3 份客户材料生成已确认的 Brief v1”。
3. 将 `BuildMix` 及其后续步骤标记为 `Skipped`，但保留在审计历史中。
4. 追加用户消息、短暂 working 状态和一张 `Revised Plan` 卡；卡片清楚显示保留、当前、跳过三类步骤。
5. 解决两个 Brief Decision 后生成 Brief Artifact，将 scoped Run 标记为 `Completed`，不生成 Mix CTA。
6. 后续点击或输入“继续完整计划”会创建新的 continuation Run，以 Brief v1 为输入，从 BuildMix 开始；不静默复用已结束 Run。

重复输入相同 scope 是幂等操作：系统回复“当前计划已经只包含 Brief”，不重复创建计划卡或修改时间线。

## 5. Mock 数据问答

固定事实查询必须读取当前 state，而不是硬编码回复文本：

- Brief：产品、US/UK、预算上限、播放目标、CPM、周期、证据要求、来源与冲突。
- Matrix：当前方案、成本、预测播放、长视频数量、失败约束和锁定状态。
- Search：搜索包数量、目标单元格、预算上限、候选目标数。
- Candidate：证据、场景、资格、风险、得分、报价、同单元格相似候选人。
- Review / Gap：30+10 校验、投影边界、缺口单元格、播放差额、剩余预算、推荐恢复动作。

问答结果使用 `FactCard`、`EvidenceCard` 或 `StatusCard` 呈现；不把多项数据塞进一段聊天文本。

## 6. 交互过程与动效

### 6.1 Turn 生命周期

每次输入经过以下 UI 生命周期：

1. User message 立即进入时间线。
2. 显示 `Agent working`，文案来自实际意图，例如“正在读取 Brief 范围并重排步骤”。
3. 在 500–800ms 的固定窗口内依次展示最多三个真实阶段：理解意图、查询/计算、生成结果。
4. 提交领域状态变化并显示最终消息卡。

忙碌期间 Composer 禁止重复提交，但页面其他只读检查仍可用。组件卸载或 Reset 时必须清理计时器，不能在新状态中补写旧结果。

### 6.2 Motion 规则

- 新消息：180ms、8px 上移淡入。
- working steps：120ms 错峰出现，完成时由空心圆过渡到实心勾选。
- Plan revision：标题与变更摘要先出现，步骤随后依序展开。
- Artifact：生成时 Context Rail 对应行做一次 400ms 黑色反白闪入。
- 时间线：新结果出现后平滑滚动到结果顶部，避免跳到页面最底部。
- 所有动画使用 transform/opacity，避免布局抖动。
- `prefers-reduced-motion: reduce` 下取消等待与位移动画，直接展示最终状态。

## 7. 黑白编辑式视觉系统

视觉方向：Monochrome Editorial Control Room。

### 7.1 色彩与表面

- `--black: #0a0a0a`
- `--ink: #171717`
- `--gray-700: #4a4a4a`
- `--gray-500: #737373`
- `--gray-300: #cfcfcf`
- `--gray-100: #f2f2f2`
- `--white: #ffffff`

删除蓝、绿、琥珀、红作为结构性色彩。Success、Waiting、Failed 通过图标、标签文案、边框样式、灰阶填充和必要的斜线纹理区分。失败状态不依赖颜色传达。

卡片不使用大面积柔和阴影。主要表面为白底、1px 黑/灰线、直角或 2–6px 小圆角；关键 CTA 使用黑底白字。

### 7.2 字体与字号

- Campaign 大标题使用系统衬线栈，形成编辑感；工作正文使用高可读无衬线系统栈。
- Campaign 标题：32–48px。
- 页面/Artifact 标题：24–32px。
- 卡片标题：18–22px。
- 正文与输入：14–16px，行高 1.5–1.65。
- 按钮：14px。
- 辅助信息、标签与表头：最低 12px。
- 不再使用 7–10px 的正文或操作文字。

### 7.3 版式

- 全局 Rail：208px 黑底白字。
- Campaign Rail：240px 白底，以横线、编号和字重建立队列层级。
- Agent Stream：最小 680px，阅读列最大宽度约 760px。
- Context Rail：320–360px。
- Inspector 打开时三栏都保留；中心列不得隐藏，Inspector 内部使用水平滚动承载 Matrix。
- 信息结构偏向编辑部版面：大编号、横向分隔、反白标题条、大留白；减少圆角卡片堆。

## 8. 组件与边界

- `intent.ts`：仅负责上下文感知的解析与可用性判断。
- `facts.ts`：从 CampaignState 构建确定性事实卡数据。
- `runRevision.ts`：纯函数实现 scope revision、幂等和 continuation Run。
- `AgentTurnController`：管理 transient working/reveal 状态；不持久化动画状态。
- `AgentTimeline`：渲染消息、working、Plan revision 与结果卡。
- `AgentComposer`：根据当前阶段生成 chips，处理 busy/disabled 状态。
- `motion.css` 与 monochrome tokens：集中管理动画与视觉变量。

领域 reducer 仍是最终状态来源；UI controller 不直接改 Brief、Matrix、Candidate 或 Artifact。

## 9. 异常与边界

- 缺少候选人上下文：解释需要从候选人卡发起，并给出“打开校准批次”动作。
- 当前阶段不可执行：说明阻塞条件与当前可选动作，不静默忽略。
- 重复 scope、重复批准或重复发布：保持幂等，并用简短状态回复。
- working 期间 Reset：取消排队 turn，恢复初始状态。
- localStorage 中旧消息仍可读取；新增 transient UI 状态不进入持久化 schema。

## 10. 验收与测试

- 截图回归：在 Brief Decision 阶段输入“先只整理 Brief”，必须出现 Revised Plan；后续完成 Decision 后 Run 为 Completed，且没有 Mix CTA。
- 动态 chips：无候选人上下文时不显示候选人解释/相似人操作；候选人 Inspector 中显示。
- Mock 问答：预算、市场、周期、证据要求、当前 Matrix 指标、30+10、Gap 数据均来自当前 state。
- 上下文 fallback：不再出现截图中的通用英文 Unsupported 文案。
- Turn lifecycle：用户消息、working、结果按顺序出现；busy 时不能重复提交；Reset 清理未完成 turn。
- 视觉：工作区正文不低于 14px，辅助信息不低于 12px；核心界面无结构性彩色 token。
- Motion：正常模式有阶段动画；reduced-motion 下无等待且功能相同。
- 保留现有业务测试，并增加 scope revision、intent table、facts、turn controller 和 shell 可访问性测试。

## 11. 非目标

- 不接入在线 LLM、后端、真实搜索、Gmail 或飞书外发。
- 不构建开放式自然语言理解；只覆盖本 Campaign 的确定性意图和当前页面数据。
- 不实现通用工作流编辑器或无限撤销历史。
- 不增加新的业务模块或独立功能 Tab。
