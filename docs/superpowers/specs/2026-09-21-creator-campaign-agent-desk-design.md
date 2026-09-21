# Creator Campaign Agent Desk 交互改造规格

**日期：** 2026-09-21  
**状态：** 待用户书面审阅  
**改造对象：** Creator Mix Planner 现有 Demo  
**参考材料：** 《面试准备｜23 GlobalStar 一面专项：Creator 营销系统、AI Agent 与业务流程设计》

## 1. 背景与问题

现有 Demo 已实现 Brief 冲突、Creator Mix、搜索任务包、候选资格、30 + 10 客户评审和 Gap 修复等业务逻辑，但产品形态仍是六个一级 Tab。用户必须自行判断下一步进入 Brief、Mix Planner、Search & Candidates 或 Client Review。

这种信息架构适合展示功能，不符合 Creator 运营的日常作业习惯，也没有体现系统本质上是 Agent 系统：客户原始材料应由 Agent 读取和归一化；Agent 应规划工作、执行低风险步骤、在高风险节点暂停、产出版本化 Artifact，并在反馈后局部回退。

本次改造不推翻已有领域能力，而是将它们重新组织为一个 Campaign Agent Workflow。

## 2. 设计目标

1. 将主产品形态从“功能 Tab 集合”改为“Campaign Inbox + Agent Run Desk + Artifact Inspector”。
2. 让客户材料成为一次 Agent Run 的输入，Agent 负责分析、计划、执行和解释。
3. 让用户只处理系统推送的关键决策，而不是手动串联业务模块。
4. 让 Brief、Mix、Search Package、Candidate Batch 和 Review Round 成为版本化、可追溯、可局部失效的 Artifact。
5. 在没有在线模型的条件下，提供可重复但可真实操作的确定性 Agent Demo。
6. 保留 Matrix 作为做深能力，包括真实公式、约束、版本锁定和下游任务生成。

## 3. 非目标

- 不接入真实在线大模型。
- 不解析真实 PDF、邮件或 Excel；材料使用确定性 Fixture。
- 不接入真实 Creator 数据源、爬虫、飞书或 Gmail 发送。
- 不构建通用 Agent Builder、通用工作流引擎或 Prompt 管理平台。
- 不增加后端、鉴权、数据库或多人并发。
- 不实现完整 Outreach、合同、内容交付和效果归因链路。

## 4. 产品原则

### 4.1 Agent 负责不确定理解，Workflow 负责确定性状态

Agent 用于材料语义理解、冲突解释、推荐理由和工作编排。预算公式、硬门禁、状态迁移、版本依赖、客户投影和外部动作审批由确定性代码控制。

### 4.2 低风险自动执行，高风险暂停确认

Agent 可以自动读取材料、提取字段、计算指标、生成候选方案和整理证据。预算、上线时间、市场范围、Matrix 锁定、客户发布和局部放宽必须由人确认。

### 4.3 Artifact 是工作结果，不是一级导航

Brief、Matrix、Candidate Batch 等不再占据一级导航。它们由 Agent Run 生成，通过消息卡片和右侧 Artifact 栏打开，并保持与当前对话并排可见。

### 4.4 反馈只回退受影响部分

客户不喜欢候选时只回到搜索或排序；平台预算变化时使 Mix 和相关下游产物失效；核心市场变化时才生成新的 Brief 版本并扩大失效范围。

### 4.5 证据优先于黑箱结论

Agent 的每个高影响判断都要显示来源、建议、理由、风险和下游影响。候选推荐不能只显示总分。

## 5. 用户与使用场景

主要用户是内部 Creator 运营和 Campaign Manager。用户从 Campaign Inbox 进入项目，在项目内把客户材料交给 Agent，并负责：

- 确认高影响冲突；
- 选择或调整 Creator Mix；
- 校准首批候选；
- 批准客户发布；
- 审批 Backup 晋升或补量任务。

客户只访问安全投影的 Review 页面，不进入内部 Agent Desk。

## 6. 一级信息架构

全局导航只保留工作入口：

- **Inbox**：按 Waiting for you、Agent running、Client replied、At risk 聚合工作；
- **Campaigns**：全部 Campaign；
- **Runs**：Agent 执行历史、失败步骤和可重试任务。

本次 Demo 不提供独立 Library。Creator 与 Artifact 只能从当前 Campaign 上下文进入，避免再增加一个展示型入口。

现有 Overview、Brief、Mix Planner、Search & Candidates、Client Review、Activity 不再作为并列一级导航。

## 7. Campaign Agent Desk 布局

```text
┌──────────────┬───────────────────────────────┬──────────────────────┐
│ Campaigns    │ Agent Run                     │ Context              │
│              │                               │                      │
│ Waiting 2    │ 用户上传 3 份材料             │ Artifacts            │
│ Running 1    │ Agent 执行计划                │ · Brief v1           │
│ At risk 1    │ 工具执行摘要                  │ · Creator Mix v1     │
│              │ 冲突确认卡                    │ · 6 Search Packages  │
│ Active       │ 产物摘要                      │ · Candidate Batch 01 │
│ · Cycling…   │ 下一步动作                    │                      │
│ · Robot…     │                               │ Decisions            │
│              │ [附件] 给 Agent 发消息…       │ · 2 resolved         │
└──────────────┴───────────────────────────────┴──────────────────────┘
```

- 左栏回答“今天要处理哪个项目”。
- 中栏承载 Agent 对话、执行过程、人工决策和下一步动作。
- 右栏持续展示 Artifact、未决事项和关键约束。
- 顶栏展示 Campaign 名称、负责人、上线倒计时和状态。
- 底部 Composer 支持补充自然语言和材料附件。

### 7.1 Artifact Inspector

点击 Artifact 不离开 Campaign：

- Agent 流缩窄但保持可见；
- 右侧展开 Artifact Inspector；
- 用户可以边查看具体字段或 Matrix 行，边向 Agent 提问；
- 修改生成新草稿或版本，不覆盖 Locked Artifact；
- Inspector 关闭后回到原 Run 位置。

## 8. 主业务流程

### 8.1 Inbox 与进入 Campaign

Inbox 卡片显示当前状态、Agent 最近动作、负责人、风险和唯一主按钮。例如：

- `Review 2 decisions`
- `Inspect candidate batch`
- `Approve client publish`
- `Resolve UK Urban gap`

### 8.2 材料作为第一条消息

用户进入新 Campaign 后加载 Email、Budget Excel 和 Meeting Notes，并补充自然语言目标。Agent 返回执行计划：读取来源、提取字段、检查冲突、生成 Brief 草稿，并声明在哪些高影响节点暂停。

用户可执行计划，也可用自然语言缩小目标，例如“先只整理 Brief”。

由于本次不接在线模型，Composer 使用受限意图解析：演示路径中的指令由显式 Action Chip 和少量固定意图驱动，例如“先只整理 Brief”“为什么推荐他”“找相似但更生活化的人”。无法识别的自由输入会明确提示 Demo 能力边界，并提供可执行建议，不伪装成任意对话都能理解。

### 8.3 可折叠执行时间线

Agent 运行时显示：

- Reading 3 sources
- Extracted 18 brief fields
- Compared source precedence
- Found 2 high-impact conflicts
- Waiting for your decision

工具细节默认折叠，只显示输入来源、耗时和结果摘要。展开后可查看具体证据，不将主界面变成日志墙。

### 8.4 Brief 冲突确认

Agent 在中栏推送 Decision Card，包含每个候选值及来源、建议、理由和影响。用户可以点击预设选项，也可以回复带条件的自然语言结果。

固定演示路径：

- Launch window 选择 8 weeks；
- Motorcycle / Skiing 选择 Pending; excluded from current plan。

全部高影响冲突解决后，Agent 自动生成 `Brief v1` 并继续下一低风险步骤。

### 8.5 Creator Mix 方案

Agent 生成 Credibility First 和 Reach Efficiency 两套方案，在对话流中比较预算、有效播放量、CPM、长视频数量与覆盖门禁。

用户选中方案后可打开 Matrix Inspector。修改 Matrix 行会调用真实计算与约束逻辑。若长视频数量降低至 2，系统阻止锁定并提供：

- Restore recommendation；
- Revise Brief。

有效方案锁定后生成 Mix v1 和六个 Search Package。

### 8.6 Calibration Batch

Agent 执行召回、补全、硬过滤、排序和多样性检查后，先交付 8～12 名代表性候选，不直接向运营展示完整 30 人客户名单。

运营可对候选执行：

- Approve；
- Reject，并选择结构化原因；
- Ask Agent，询问推荐或排除原因；
- Find similar，要求同类但更符合某种风格的候选。

Ask Agent 和 Find similar 使用候选证据、Reject 原因与预置意图生成确定性结果，不调用在线模型。

固定反例：

- Torque Atlas：高触达但只有摩托车内容，因缺少真实骑行证据被 Disqualified；
- Open Air Edit：没有可验证证据，进入 Needs Review。

原因标签只调整当前 Campaign 的可见规则。Agent 必须说明改变了什么、影响哪些任务包、哪些硬条件不变。

### 8.7 完整客户名单与发布

Calibration 通过后，Agent 扩展为 30 名客户候选和 10 名内部 Backup。发布前推送 Approval Card：

- 显示 30 + 10 完整性；
- 显示关键 Matrix Cell 覆盖；
- 提供 Client projection 预览；
- 强制用户确认 Publish Round 1。

客户投影只允许达人、平台、受众与表现摘要、骑行证据、推荐理由、交付物、报价区间、版权摘要和决策字段。内部价格、评分细项、风险备注、付款条款和 Backup 策略禁止进入客户投影。

### 8.8 客户反馈与局部修复

客户反馈进入后，Campaign 回到 Inbox 的 Waiting for you。Agent 总结通过、Maybe、Pass 和原因分布，并基于 Locked Mix 重算 Forecast。

固定演示路径：UK Urban 候选被 Pass，产生两个覆盖缺口。Agent 先建议 Promote Backup，再为剩余缺口创建 Replenishment Package。只重跑受影响的 UK Urban Search Package，Brief 和 Mix 保持有效。

## 9. Agent 消息类型

只实现六类稳定组件：

1. **Plan Card**：步骤、预期产物、暂停点和 Run 动作；
2. **Run Group**：工具执行过程与可折叠证据；
3. **Decision Card**：证据、建议、影响、选项和解决状态；
4. **Artifact Card**：产物摘要、版本、状态和打开入口；
5. **Exception Card**：错误类型、影响和 Retry / Revise / Send to human；
6. **Next Action Card**：一个推荐主动作和有限替代动作。

普通消息用于补充上下文和下达指令。关键状态必须持久化到 Run Step、Decision 或 Artifact，不能只存在消息文本里。

## 10. 数据模型

### 10.1 AgentRun

- `id`
- `campaignId`
- `goal`
- `status`: Planned / Running / WaitingForDecision / WaitingForApproval / Failed / Completed
- `currentStepId`
- `inputArtifactIds`
- `outputArtifactIds`
- `startedAt`
- `completedAt`

### 10.2 RunStep

- `id`
- `runId`
- `kind`
- `label`
- `status`: Pending / Running / Waiting / Succeeded / Failed / Skipped
- `inputRefs`
- `outputRefs`
- `summary`
- `error`
- `startedAt`
- `completedAt`

### 10.3 AgentMessage

- `id`
- `runId`
- `role`: User / Agent / System
- `type`: Text / Plan / RunGroup / Decision / Artifact / Exception / NextAction
- `createdAt`
- `payloadRef`

### 10.4 DecisionRequest

- `id`
- `runId`
- `stepId`
- `question`
- `options`
- `evidence`
- `recommendation`
- `impactByOption`
- `status`: Pending / Resolved
- `resolution`
- `resolvedAt`

### 10.5 Artifact

- `id`
- `campaignId`
- `kind`: Brief / Mix / SearchPackageSet / CandidateBatch / ReviewRound / GapAssessment
- `version`
- `status`: Draft / Ready / Locked / Published / Stale
- `sourceRunId`
- `sourceStepId`
- `parentArtifactIds`
- `summary`
- `domainRef`
- `createdAt`

现有领域模型继续保存详细数据，Artifact 只负责 Run、版本和依赖关系。

## 11. 确定性 Agent Run

本次 Agent 不是录像，也不伪装成自由模型。它由 Fixture、用户动作、Reducer 和纯领域函数驱动：

```text
PLANNED
→ RUNNING
→ WAITING_FOR_DECISION
→ RUNNING
→ ARTIFACT_READY
→ WAITING_FOR_APPROVAL
→ COMPLETED
```

用户决策真实改变下游：

- 6 周触发排期风险；
- 排除相邻运动使摩托车 Creator 被硬过滤；
- Matrix 修改重新计算成本、播放量和门禁；
- “太商业”提高当前 Campaign 的生活方式内容偏好；
- UK Urban Pass 只触发对应任务包的修复。

## 12. 异常与回退

1. 材料缺失：列出缺失字段，提供 Upload、Add assumption、Ask client。
2. 高影响冲突：Run 进入 WaitingForDecision，禁止继续。
3. Matrix 门禁失败：阻止锁定，提供恢复建议或修改 Brief。
4. 候选不足：展示缺口和逐级放宽建议，用户确认后应用。
5. 模拟工具失败：只重试当前 Step，不重跑 Campaign。
6. 上游变化：只将受影响 Artifact 标记 Stale，并解释重跑范围。
7. 客户发布等外部动作：必须 Preview + Approve。

## 13. 现有页面重组

| 现有页面 | 新位置 | 处理方式 |
| --- | --- | --- |
| Overview | Inbox + Campaign 顶部摘要 | 删除独立大屏 |
| Brief | Brief Artifact Inspector | 保留来源、冲突和版本 |
| Mix Planner | Mix Artifact Inspector | 保留 Matrix、方案与门禁 |
| Search & Candidates | Run Group + Candidate Batch Inspector | 搜索由 Agent 驱动 |
| Client Review | Publish Approval + Client Preview | 发布作为外部动作 |
| Activity | Run History | 不再作为业务步骤 |

## 14. 验收标准

### 14.1 交互验收

1. 首页首先展示 Inbox 和 Waiting for you，而不是六个功能 Tab。
2. 进入 Cycling Camera Campaign 后第一屏是 Agent Run。
3. 加载三份材料后，Agent 展示计划并自动执行低风险步骤。
4. Agent 在两个高影响冲突处暂停，确认后自动继续。
5. Brief v1 出现在 Artifact 栏，并可与 Agent 并排查看。
6. 两套 Mix 在 Agent 流内比较；无效修改触发可解释门禁。
7. Mix 锁定后自动生成搜索任务并交付 Calibration Batch。
8. Reject 原因触发可解释的当前 Campaign 规则调整。
9. 校准后形成 30 名客户候选和 10 名隐藏 Backup。
10. 客户发布必须先预览并批准。
11. UK Urban 反馈产生可追溯 Gap。
12. Backup 晋升与 Replenishment 只重跑受影响任务包。

### 14.2 业务验收

- 骑行头戴摄像头背景贯穿材料、Mix、证据、推荐与反馈。
- Agent 管理模糊理解和工作编排，确定性代码管理预算和门禁。
- 所有高影响推荐都有来源、理由、风险和影响。
- Brief、Mix、任务包、批次和评审版本关系可追溯。
- 高风险动作必须人工确认。
- 反馈支持局部回退。
- 无在线模型时仍能重复演示关键分支。

### 14.3 自动化测试

- Agent Run 状态转换与暂停点。
- Decision 解决后生成正确 Brief Artifact。
- Locked Mix 的下游 Artifact 依赖。
- 上游变化的精准 Stale 传播。
- Matrix 硬约束继续沿用现有测试。
- 候选硬过滤与反例继续沿用现有测试。
- Calibration 原因只影响当前 Campaign 规则。
- 客户投影敏感字段隔离。
- Feedback → Gap → Backup → Replenishment 完整流程。
- Reset 恢复确定性初始 Run。

## 15. 改造边界

### 15.1 保留

- Brief 冲突领域逻辑；
- Matrix 计算、方案、门禁和版本；
- Search Package 生成；
- 候选证据、透明评分和失败 Case；
- 30 + 10、客户安全投影、Gap 和 Replenishment；
- 现有领域测试。

### 15.2 重做

- App Shell 与导航；
- 首页和 Campaign 入口；
- Agent Run 状态与消息流；
- Plan、Run、Decision、Artifact、Exception、Next Action 卡片；
- Artifact Inspector；
- Demo Walkthrough 与 README。

## 16. 完成定义

本次改造完成时，评审者无需按预设 Tab 顺序探索产品。只需从 Inbox 打开 Cycling Camera Campaign，沿 Agent 推送的计划、决策、Artifact 和下一步动作，即可完成从客户材料到客户反馈修复的闭环。Matrix 仍然是计算最深的业务能力，但 Agent Workflow 成为产品的主交互和主叙事。
