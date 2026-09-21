# Evidence Qualification Studio 与 Agent Turn 交互规格

**日期：** 2026-09-21  
**状态：** 待用户书面审阅  
**适用项目：** Creator Mix Planner  
**核心业务：** 为骑行头戴摄像头 Campaign 校准 Creator 候选资格与证据，并扩展为 30 名客户候选和 10 名内部 Backup

## 1. 背景与目标

当前 Demo 已做深 Creator Mix Matrix，但候选校准仍以卡片列表为主：资格结论、头戴摄像头证据、推荐理由和用户反馈之间缺少连贯的审阅链路。同时，用户向 Agent 提问后结果几乎立即出现；现有 working 状态一次性展示固定文案，无法表达 Agent 正在理解任务、读取工作区数据、调用确定性工具并组织答案。

本次建设第二个高价值模块 **Evidence Qualification Studio**，并同步升级所有 Agent 问答的 Turn 体验。目标是：

1. 在现有右侧 Artifact Inspector 内完成 10 人校准，不新增一级页面或 Tab。
2. 用“规则 → 证据 → 结论 → 风险”的可解释链判断 Creator 是否适合骑行头戴摄像头 Campaign。
3. 将 Reject 反馈变为当前 Campaign 的软偏好，并确定性地预览影响、应用和重排。
4. 通过校准门槛后生成 30 Primary + 10 Backup，回到原有主流程。
5. 让 Agent Turn 呈现真实的任务阶段和工具调用摘要，最终答案用克制的打字机动画出现。
6. 在有限总时间内控制实现规模，并为用户自行验收预留充足时间；P0 优先完成闭环，不为低概率情形过度设计。

## 2. 产品原则

### 2.1 头戴摄像头适配是核心，不是通用达人评分

资格判断必须优先回答：Creator 是否有真实骑行场景，以及是否有足以证明 POV、稳定性和复杂光照表现的内容证据。粉丝量、制作精度或商业表现不能覆盖硬门禁失败。

### 2.2 Agent 解释，确定性领域逻辑裁决

Agent 可以组织理由、引用规则与回答问题；资格门禁、评分、反馈应用、重排和 30 + 10 完整性必须由纯函数或 reducer 控制。同一状态下重复操作必须得到相同结果。

### 2.3 Inspector 是作业面，Agent Desk 是上下文

校准在现有右侧 Inspector 中完成。Agent 时间线始终可见，用户可以边查看候选证据边提问；关闭并重开 Inspector 后保留候选位置和已提交反馈。

### 2.4 展示执行摘要，不展示隐藏思维链

“思考”阶段只展示可验证的任务理解和执行状态，例如“正在核对骑行证据”，不展示模型内部推理过程。工具名称、输入范围和结果摘要必须与实际本地函数或数据读取一致，不能用虚构日志制造智能感。

## 3. 范围与非目标

### 3.1 P0 范围

- 右侧 Inspector 内的 10 人校准导航与逐人审阅。
- 6 项资格硬门禁、证据置信度、资格结论和可解释评分。
- 规则与证据引用的 Agent 问答。
- Accept、Reject with reason、Needs follow-up 三类审阅结果。
- Reject 影响预览、幂等应用 Campaign 软偏好和确定性重排。
- 校准完成门槛与 30 + 10 扩展。
- Agent Turn 的阶段式状态、真实工具摘要、打字机答案和折叠轨迹。
- 正常动效、错误反馈、聊天滚动和 reduced-motion 行为。

### 3.2 P1 范围

- Evidence Card 与 Agent 引用之间的定位高亮。
- 更丰富的卡片错峰入场和候选切换过渡。
- Needs follow-up 的补充说明和细分原因。
- 可控的工具失败演示与 Retry 状态。

P1 不能阻塞 P0 验收；时间不足时直接移除，不留半成品入口。

### 3.3 非目标

- 不接入在线 LLM、真实 Creator 搜索 API、爬虫或视频识别。
- 不实现开放域聊天、通用 Agent 编排器或工具市场。
- 不实现评分权重编辑器、复杂筛选器、批量导入导出。
- 不建立独立审核中心、全屏审核模式或新的一级导航。
- 不让校准反馈修改 Locked Brief 或 Locked Matrix。
- 不为任意缺字段组合构建复杂恢复框架；固定演示数据必须完整，已识别的关键异常提供明确降级。

## 4. 端到端用户流程

### 4.1 生成校准样本

Search Packages 就绪后，Agent 对 42 名 Mock 候选执行资格判断，从 6 个 Matrix 单元格生成 10 人校准样本：

- 8 名推荐候选，用于确认方向；
- 2 名失败样本，用于证明硬门禁有效；
- Torque Atlas：制作质量高但只有摩托车内容，因缺少真实骑行证据而 Disqualified；
- Open Air Edit：缺少可验证证据，进入 Needs Review。

用户从 Agent 的唯一主动作“开始 10 人校准”打开 Candidate Batch Artifact。

### 4.2 在 Inspector 中逐人审阅

Inspector 顶部固定显示：

- `CALIBRATION · 3/10`；
- 当前 Creator 名称、平台和 Matrix Cell；
- 10 人状态序列与上一个/下一个按钮。

主体按以下顺序展示：

1. **Agent Verdict**：Qualified / Needs Review / Disqualified、置信度、核心理由和风险。
2. **Hard-rule checks**：6 项门禁的 Pass / Review / Fail。
3. **Evidence Cards**：来源、证据摘要、时间、新鲜度和置信度。
4. **Fit score**：只对通过资格的候选展示分项与总分；硬门禁失败时总分不可用于推荐。
5. **Agent Explanation**：简短、可引用的结论链，以及当前上下文可用的快捷问题。

底部操作区保持可见：Accept、Reject with reason、Needs follow-up。提交后自动保存并移动到下一个未审阅候选；用户仍可返回修改。

### 4.3 询问 Agent

候选上下文内提供四个 P0 确定性问题：

- 为什么推荐他？
- 哪条证据证明适合头戴摄像头？
- 他有什么风险？
- 找同一 Matrix Cell、但更生活化的候选。

回答必须读取当前 `QualificationResult`、规则和 Evidence，不硬编码成独立文案。回答中的引用可回到当前 Inspector 对应区块。

### 4.4 Reject、影响预览与重排

Reject 原因使用有限枚举，例如 Too commercial、Not enough POV evidence、Audience mismatch。提交 Reject 后先显示影响预览：

- 将新增或加强的 Campaign 软偏好；
- 预计影响的候选和 Search Package；
- 明确声明不会变化的 Brief 硬条件和 Matrix 配额。

用户点击“应用并重排”后才写入偏好并重排。相同 Reject 原因重复应用只更新现有偏好，不新增重复记录。若原因是“No real cycling”，它属于资格纠正，候选直接按硬门禁重算，不转成软偏好。

### 4.5 完成校准并扩展 30 + 10

“批准方向并扩展 30 + 10”满足以下条件后可用：

- 至少审阅 3 人；
- 至少 2 名 Qualified 候选已 Accept；
- 至少审阅 1 个失败样本；
- 至少应用 1 次偏好调整，或显式选择“无需调整”。

批准后，系统用相同资格规则和已确认 Campaign 偏好确定性地生成 30 名 Primary 与 10 名 Backup，注册 Candidate Batch Artifact，并将 Agent 主流程推进到客户投影校验。

## 5. 资格、证据与评分规则

### 5.1 六项硬门禁

1. 市场符合 Search Package。
2. 平台和内容形式符合交付要求。
3. 存在可验证的真实自行车骑行内容。
4. 骑行场景符合目标 Matrix Cell。
5. 存在头戴摄像头相关证明：POV 构图、运动稳定性或复杂光照至少有明确证据。
6. 版权、档期和商业条件具备可执行性。

资格结果：

- **Qualified**：所有核心硬门禁通过，商业信息可执行。
- **Needs Review**：证据缺失、过期、报价未确认或预算超出但可能协商。
- **Disqualified**：真实骑行、市场、平台/形式或目标场景等不可放宽条件失败。

预算超过 ceiling 进入 Needs Review / High risk，不直接永久淘汰；没有真实自行车骑行内容必须 Disqualified。

### 5.2 Fit Score

只有资格通过后 Fit Score 才参与排序：

| 维度 | 权重 |
|---|---:|
| 场景与产品相关性 | 30 |
| 头戴摄像头 / POV 证据质量 | 25 |
| 内容制作质量 | 15 |
| 表现稳定性 | 15 |
| 商业可行性 | 10 |
| 受众匹配 | 5 |

总分 100。高分不得覆盖任何硬门禁失败。

### 5.3 可解释链与证据置信度

每个关键结论统一为：

`Conclusion → Because (Brief / Matrix rule) → Evidence → Risk`

Evidence 置信度为 High / Medium / Low：

- High：直接、近期、来源明确；
- Medium：可以支持判断，但较旧或需间接推断；
- Low：信息不完整或来源不可靠，只能触发 Needs Review。

缺失证据不能显示为 Pass；过期证据降低置信度并产生风险提示。

## 6. Agent Turn 交互

### 6.1 生命周期

每次用户提问按以下顺序执行：

1. 用户消息立即追加到聊天底部。
2. 显示任务理解阶段，例如 `正在理解：解释当前候选的推荐依据`。
3. 逐步展示与本次问题匹配的真实工具步骤，状态依次为 Running → Done。
4. 显示 `正在组织回答…`。
5. Agent 文本以打字机效果出现；文本完成后，结果卡片和 CTA 淡入。
6. Turn 完成后将执行过程折叠为 `使用 4 项工作区检查完成分析 · 查看过程`。

阶段名称是执行摘要，不使用“展示思维链”“内部推理”等表述。

### 6.2 问题与工具步骤映射

| 问题类型 | 执行步骤示例 |
|---|---|
| 为什么推荐 | 读取 Matrix Cell → 校验 6 项门禁 → 检查相关 Evidence → 汇总评分与风险 |
| 头戴摄像头证据 | 读取产品证据规则 → 筛选 POV / 稳定性 / 光照证据 → 检查来源与新鲜度 |
| 找相似候选 | 读取当前 Matrix Cell → 应用硬门禁 → 应用 Campaign 偏好 → 按 Fit Score 重排 |
| 预算问题 | 读取报价 → 对比 Search Package ceiling → 标记商业风险 |
| 下一步 | 读取当前 Run 和 Artifact 状态 → 校验阻塞条件 → 生成唯一推荐动作 |
| 状态修改 | 校验当前状态 → 预览影响 → 用户确认后提交 reducer action → 返回新状态摘要 |

只展示实际发生的步骤。若一个问题只需两项检查，不补足成固定四步。

### 6.3 动效与时间

- 理解阶段：约 200–350ms。
- 每个工具步骤：约 180–320ms，最多展示 4 项。
- 最终文本：按内容长度控制在 450–900ms，长答案最长约 1.2s。
- 一次普通 Turn 总时长目标为 1.2–2.2s。
- 新阶段和答案使用 opacity / transform，避免布局跳动。
- CTA 在正文完成后再淡入，避免用户提前点击未完成结果。
- `prefers-reduced-motion: reduce` 下取消人为等待和逐字效果，直接显示完整内容，但保留阶段与工具摘要。

### 6.4 滚动与并发

- 任一时间只允许一个 active turn；期间 Composer 和快捷操作禁用。
- 用户原本位于聊天底部时，新消息、工具步骤和打字内容持续保持底部可见。
- 用户主动向上浏览历史后，不抢夺滚动位置；显示“回到最新”提示。
- 打开或更新 Inspector 不改变聊天滚动位置。
- 刷新后保留最终回答和已折叠执行轨迹，不恢复半截打字或 Running 状态。

### 6.5 失败与重试

- 工具步骤失败时停在该步骤，展示失败摘要和 Retry。
- Retry 重跑同一确定性任务，不重复追加用户消息。
- 页面 Reset、切换 Campaign 或组件卸载时取消计时器和待提交 Turn，旧 Turn 不得写入新 Campaign。
- 重复点击已完成动作保持幂等，并返回当前状态，而不是再次生成产物。

## 7. 数据模型与组件边界

### 7.1 核心模型

```ts
interface QualificationResult {
  candidateId: string;
  status: "Qualified" | "NeedsReview" | "Disqualified";
  confidence: "High" | "Medium" | "Low";
  gateResults: GateResult[];
  scoreBreakdown: ScoreBreakdown | null;
  evidenceIds: string[];
  risks: string[];
}

interface CalibrationReview {
  candidateId: string;
  decision: "Accepted" | "Rejected" | "NeedsFollowUp";
  reason?: RejectReason;
  preferenceId?: string;
  reviewedAt: string;
}

interface AgentTurn {
  id: string;
  query: string;
  status: "Understanding" | "RunningTools" | "Composing" | "Completed" | "Failed";
  steps: AgentToolStep[];
  answerRef?: string;
}

interface AgentToolStep {
  id: string;
  label: string;
  status: "Pending" | "Running" | "Done" | "Failed";
  inputRefs: string[];
  summary?: string;
}
```

Agent 回答引用 `ruleIds` 和 `evidenceIds`。动画进度是临时 UI 状态；完成后的问题、答案和折叠轨迹可以持久化。

### 7.2 组件边界

- `qualification.ts`：硬门禁、置信度和 Fit Score 的纯函数。
- `calibration.ts`：样本生成、审阅门槛、偏好影响和确定性重排。
- `agentTurn.ts`：将意图映射为真实步骤，生成可持久化的完成轨迹。
- `useAgentTurn`：定时推进瞬时阶段、取消任务与 Retry；不直接修改领域状态。
- `QualificationInspector`：候选导航和各证据区块。
- `CalibrationActions`：Accept / Reject / Follow-up 与影响确认。
- `AgentTurnTrace`：运行中步骤和完成后的折叠摘要。
- `TypewriterAnswer`：答案显示；在 reduced-motion 下直接完成。

领域 reducer 是资格反馈、偏好、候选顺序和 Artifact 的唯一写入入口。

## 8. 页面布局与视觉

沿用已确认的黑白、圆角 Agent Desk，不建立新的视觉体系：

- Inspector 使用 12–16px 圆角卡片和清晰的段落间距；正文不低于 14px，辅助文字不低于 12px。
- 宽 Inspector 内部采用两列：左侧结论/门禁/评分，右侧 Evidence/Agent；空间不足时自然堆叠。
- 顶部候选进度和底部操作区保持固定，中间内容独立滚动。
- Running 使用轻量骨架、圆点脉冲和逐步勾选；不使用大面积彩色 loading。
- 状态不仅依赖颜色，同时使用文字、图标和边框表达。

## 9. 关键异常处理

- 找不到 Search Package：候选进入 Needs Review，并解释缺少哪个 Matrix Cell 上下文。
- 找不到 Evidence：对应门禁不能 Pass，回答指出缺失证据和建议动作。
- 报价未确认或超过上限：保留候选但标记商业风险。
- 同类候选为空：解释哪个 Matrix Cell 缺少合格供给，不返回空白卡片。
- 重复 Reject 原因：更新已有 Campaign 偏好，不重复计数。
- 关闭/重开 Inspector：恢复上次候选、审阅状态和滚动起点。
- 用户反馈：只影响 Campaign 偏好与候选排序，不修改 Brief 或 Matrix。

## 10. 验收流程

### 10.1 主演示顺序

1. 从 Agent Desk 点击“开始 10 人校准”，右侧 Inspector 平滑打开。
2. 查看一名 Qualified 候选：6 项门禁、头戴摄像头 Evidence、置信度和 Fit Score 可追溯。
3. 点击“为什么推荐他”：依次看到任务理解、真实工具检查、组织回答，再看到打字机答案和证据引用。
4. 切换 Torque Atlas：即使制作分高，也因只有摩托车内容而 Disqualified。
5. 对一名候选选择 Too commercial：先预览影响，再应用 Campaign 偏好；列表确定性重排且偏好只记录一次。
6. 完成至少 3 人审阅和失败样本检查，满足校准门槛。
7. 点击“批准方向并扩展 30 + 10”：生成完整 Candidate Batch，并回到客户投影校验的下一步。

### 10.2 自动化验收

- 六项硬门禁的表驱动测试，包括真实骑行失败、证据缺失、报价超限。
- Fit Score 权重总和、硬门禁优先级和稳定排序测试。
- Reject 原因幂等、影响预览和 Campaign 偏好应用测试。
- 校准门槛和 30 + 10 完整性测试。
- Agent 问题到工具步骤的映射测试，确保不展示未执行步骤。
- Turn 状态机、取消、Retry、刷新恢复和单 active turn 测试。
- 打字机结束后才出现 CTA；reduced-motion 下直接完成。
- 聊天 pinned / unpinned 滚动和 Inspector 打开不抢滚动测试。
- 关键页面可访问性、按钮焦点和键盘导航测试。

## 11. 完成定义

P0 自动化测试和构建全部通过；按主演示顺序可以从校准样本走到 30 + 10，过程中能清楚证明：

- 系统理解的是骑行头戴摄像头业务，而非通用达人榜单；
- 资格由硬门禁和证据决定，评分只在合格后排序；
- 用户反馈会以可预览、可解释的方式影响当前 Campaign；
- Agent 交互具有理解、工具执行、回答三个阶段，但不伪造工具或暴露隐藏思维链；
- 整个模块留在右侧 Inspector 内，与现有 Agent 主流程形成一个闭环。
