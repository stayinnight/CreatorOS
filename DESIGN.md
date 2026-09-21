# Campaign Agent Desk：产品与系统设计

## 1. 问题与目标

本项目服务于一款在美国和英国发布的骑行头戴摄像头。客户需求分散在 Email、预算 Excel 和会议纪要中，包含预算、市场、平台、内容形式、上线时间、版权和候选人数量等信息，也存在“6 周还是 8 周上线”“是否纳入摩托车和滑雪 Creator”等冲突。

系统要解决的不是单次搜索 Creator，也不是生成一张静态名单，而是把多源需求转成一条可追踪的工作链：

```text
客户材料
→ Brief 冲突与版本
→ 两套 Creator Mix / Budget Matrix
→ Search Packages
→ Candidate Batch 与证据资格
→ 30 人客户名单 + 10 人内部 Backup
→ 客户反馈
→ Gap Assessment
→ Backup 晋升 / 局部补池 / 上游版本调整
```

题目只要求把完整闭环设计清楚，并任选一条关键路径做实。本项目额外提供了可点击的端到端演示；工程深度集中在 Matrix 约束计算，同时把候选人证据资格和客户字段投影也做成确定性逻辑。

## 2. 固定业务条件

| 维度 | 条件 |
|---|---|
| 产品 | 骑行头戴摄像头 |
| 市场 | US、UK |
| 骑行场景 | Road、MTB、Urban Commuting |
| 核心证明点 | 第一视角、运动防抖、复杂光线、安全记录、免手持安装 |
| 平台 | YouTube 必须覆盖；TikTok、Instagram 作为补充 |
| 总预算 | 不超过 `$180,000`，Rights 费用计入总预算 |
| 有效播放 | 至少 `2,600,000` |
| 综合 CPM | 不超过 `$70` |
| 长视频 | 至少 3 位可完成高质量 YouTube 长视频的 Creator |
| 首轮名单 | 客户可见恰好 30 人 |
| Backup | 内部保留至少 10 人，不默认暴露给客户 |

固定演示中，上线周期选择 Excel 中的 8 周；摩托车和滑雪仍为待确认范围，不进入当前骑行方案。这是有来源的人工决策，不被描述成客户原始事实。

## 3. 成功标准

完成一次演示后，系统必须能回答：

1. 当前方案是否满足预算、播放量、CPM、YouTube、长视频、市场和骑行场景约束？
2. 两套 Mix 的差异是什么，各自在可信度和触达效率之间做了什么取舍？
3. 每个 Search Package 来自哪个 Brief 和 Matrix Cell？
4. 为什么某位 Creator 合格、待补证据或被淘汰？
5. 客户 Pass 候选人后，缺口发生在哪里，应提升 Backup、继续补池，还是回到 Matrix / Brief？

## 4. 用户与职责边界

- **Campaign Strategist**：确认 Brief，比较并锁定 Creator Mix。
- **Creator Researcher**：按 Search Package 组织候选批次和证据。
- **Account Manager**：发布客户评审轮次，记录正式反馈。
- **Client**：只访问安全投影，执行 Select、Maybe、Pass 并留下原因。

当前 Demo 不实现账号和权限服务。内部/客户边界由独立投影函数和自动化测试证明，而不是仅依赖页面隐藏。

## 5. 产品形态：Agent 主流程，不是功能 Tab

全局入口只保留 Inbox、Campaigns 和 Runs。用户从待办进入 Campaign 后，主界面由三部分构成：

- 左侧 Campaign Rail：回答“当前要处理哪个项目”。
- 中间 Agent Timeline：展示用户消息、执行计划、阶段进度、人工决策和唯一推荐下一步。
- 右侧 Context / Artifact Inspector：查看 Brief、Matrix、Search Package、Candidate Batch、Review Round 和 Gap，但不离开 Agent 上下文。

Artifact 是 Agent 的工作产物，不是一级导航。点击 Artifact 时 Agent Timeline 保持可见，用户可以边看证据边追问。

### 5.1 Agent 的控制边界

- Agent 可以读取固定材料、解释冲突、生成候选方案、整理证据并提出建议。
- 预算、公式、资格硬门禁、版本关系、状态迁移和客户字段投影由确定性 TypeScript 逻辑执行。
- 上线时间、范围冲突、Matrix 锁定、校准方向和客户发布等高影响动作必须由用户确认。
- Agent Turn 展示“理解任务 → 调用工作区工具 → 组织回答”的可验证摘要，不展示隐藏思维链，也不伪造在线模型行为。

### 5.2 消息与工作状态

关键状态不能只存在聊天文案中。系统使用稳定对象保存：

- `AgentRun`：目标、状态、当前步骤、输入和输出 Artifact。
- `RunStep`：Pending、Running、Waiting、Succeeded、Failed、Skipped。
- `DecisionRequest`：问题、来源证据、推荐项、各选项影响和最终决议。
- `Artifact`：类型、版本、来源 Run / Step、父产物和领域对象引用。

Runs 页面保留执行历史、局部失败和恢复轨迹，避免对话结束后无法解释系统做过什么。

## 6. 端到端运行链路

### 6.1 材料分析与 Brief

用户加载 Email、Excel 和 Meeting Notes 后，Agent 先展示执行计划，再开始分析。它可以自动完成低风险整理，但遇到两个高影响冲突时暂停：

1. 上线时间：Meeting 的 6 周与 Excel 的 8 周冲突；
2. 内容范围：真实自行车骑行与摩托车/滑雪扩展建议冲突。

每个 Decision Card 展示候选值、来源、建议、理由和下游影响。全部冲突解决后生成不可变的 `Brief v1`。

Brief 字段保留值、来源、证据、确认状态和版本关系。后续若预算、市场、时间、Rights 或正式内容范围改变，应 Fork `Brief v2`，而不是覆盖 v1。

当前实现使用固定 Fixture，不声称能够通用解析任意邮件、Excel 或会议纪要。

### 6.2 两套 Creator Mix

Agent 从 Brief 生成两套可比较方案：

- **Credibility First**：增加 YouTube 长视频和产品证明能力，优先可信度。
- **Reach Efficiency**：增加短内容配比，优先有效播放和 CPM 效率。

每个 Matrix Row 表示：

```text
Market × Platform × Riding Scenario × Creator Tier × Content Format
```

原始输入包括计划人数、单人发布数、相关内容播放中位数、Creator Fee、Rights Cost、其他计入成本和搜索倍数。

计算公式为：

```text
Row Cost = Planned Creators × (Creator Fee + Rights Cost + Other Cost)
Expected Views = Planned Creators × Posts per Creator × Median Relevant Views
Row CPM = Row Cost ÷ Expected Views × 1000
Total Cost = sum(Row Cost)
Total Expected Views = sum(Expected Views)
Blended CPM = Total Cost ÷ Total Expected Views × 1000
```

Blended CPM 是总成本除以总播放量，不能使用各行 CPM 的算术平均值。

### 6.3 Matrix 硬约束与版本

锁定前必须同时满足：

- 总成本 `≤ $180,000`；
- 有效播放 `≥ 2,600,000`；
- Blended CPM `≤ $70`；
- 包含 YouTube；
- 长视频 Creator `≥ 3`；
- US 与 UK 均覆盖；
- Road、MTB、Urban 均覆盖；
- Brief 不存在未解决冲突；
- 数字字段有效，预计播放不为零。

测试失败动作会把长视频或场景覆盖降到门槛以下。系统立即列出失败项并禁止锁定；Restore 后重新计算，通过才能生成 Locked Matrix。锁定版本不因后续客户反馈被静默修改。

基准计算：`180,000 / 2,600,000 × 1000 = 69.23`，满足 CPM；若播放降为 `2,500,000`，CPM 变为 `72`，播放和 CPM 同时失败。

### 6.4 从 Matrix 生成 Search Packages

Locked Matrix 的每个有效 Cell 派生一个 Search Package。核心字段包括：

- `briefVersionId`、`matrixVersionId`、`matrixCellId`；
- market、platform、riding scenario、tier、format；
- 目标合作人数、候选目标数、Backup 目标数；
- 单人预算上限、播放下限和 Rights 要求；
- must-have、exclusion、evidence requirements；
- owner、due date、status 和可选 `parentPackageId`。

候选目标数由计划人数和 Search Multiplier 计算。补池任务继承原 Package 条件并记录 `parentPackageId`，因此不会变成脱离方案的“幽灵任务”。仓库中的 `fixtures/search-package.example.json` 提供了独立示例。

### 6.5 证据资格与校准

系统先从 42 名固定候选中产生 10 人校准样本，而不是直接把 30 人名单交给客户。样本包含推荐方向和明确反例：

- **Torque Atlas**：触达表现高，但只有摩托车证据，因缺少真实自行车骑行而 Disqualified；
- **Open Air Edit**：缺少可核验内容，进入 Needs Review。

每位 Creator 依次通过 6 项门禁：

1. 市场匹配；
2. 平台与内容形式匹配；
3. 存在可核验的真实自行车骑行；
4. 场景匹配当前 Matrix Cell；
5. 有 POV、防抖、弱光或免手持等头戴摄像头证明；
6. Rights、档期和预算具备执行条件。

资格结果只有 Qualified、Needs Review、Disqualified。预算略超 Cell Ceiling 属于可协商风险，进入 Needs Review；没有真实骑行属于硬失败，不能被高播放量或高制作分覆盖。

只有 Qualified 候选才计算 Fit Score：

| 维度 | 权重 |
|---|---:|
| 场景与产品相关性 | 30% |
| 头戴摄像头 / POV 证据 | 25% |
| 内容制作质量 | 15% |
| 表现稳定性 | 15% |
| 商业可执行性 | 10% |
| 受众匹配 | 5% |

用户可以 Accept、Needs follow-up，或带结构化原因 Reject。反馈先展示影响，再成为当前 Campaign 的软偏好；市场、真实骑行和 Matrix 配额等硬条件不会被篡改。“No real cycling”属于资格纠错，不被学习成软偏好。

达到最低校准条件后，系统使用同一资格逻辑扩展为 30 名 Primary 和 10 名内部 Backup。

### 6.6 客户投影与发布

发布前检查：

- 客户候选恰好 30 人；
- 全部候选为 Qualified；
- 内部 Backup 至少 10 人且全部合格；
- 关键 Matrix Cell 有 Backup；
- 客户视图没有内部敏感字段。

客户投影通过 `toClientCandidate` 创建新的白名单对象，只复制允许字段，不采用“复制内部对象后删除若干字段”的黑名单方式。

客户可见：Creator、平台、市场、场景、相关表现、交付物、报价区间、Rights 摘要、证据、决策和评论。

内部字段如历史询价、内部备注、评分明细、Gmail Thread ID、付款条款和 Primary / Backup 策略不会进入投影。`src/tests/projection.test.ts` 固定验证这条边界。

### 6.7 客户反馈与局部恢复

客户提交 Select、Maybe、Pass 后，系统基于 Locked Matrix 重算覆盖。Select 和 Maybe 计入 Forecast，Pass 不计入。

固定演示中，UK Urban 候选被 Pass，产生局部缺口。处理顺序为：

1. **Promote Backup**：同一 Matrix Cell 有合格 Backup 时优先提升；
2. **Replenish**：Backup 仍不足时，仅为受影响 Cell 创建补池 Package；
3. **Replan Matrix**：客户偏好改变组合结构但总体目标不变时，Fork 新 Matrix；
4. **Revise Brief**：预算、市场、时间、Rights 或正式范围改变时，Fork 新 Brief。

当前 Demo 中 Promote Backup 和 Replenish 可交互执行；Replan Matrix 与 Revise Brief 已设计并能被推荐，但没有实现完整编辑器。这是有意控制的工程范围，不是隐式遗漏。

## 7. 核心领域关系

```text
Campaign
  └─ BriefVersion
      └─ MatrixScenario / MatrixVersion
          └─ MatrixCell
              └─ SearchPackage
                  └─ CandidateBatch
                      └─ CampaignCandidate + Evidence + Quote
                          └─ ReviewRound
                              └─ ClientDecision
                                  └─ GapAssessment
                                      ├─ Backup Promotion
                                      ├─ ReplenishmentPackage
                                      ├─ MatrixVersion Fork
                                      └─ BriefVersion Fork
```

Creator 身份与 Campaign 内候选状态分离。Evidence、Quote、Recommendation、Primary / Backup 角色和 Client Decision 都属于 Campaign Candidate，避免把“这个人是谁”和“这次 Campaign 如何判断他”混成一个对象。

## 8. Rights、Quote 与证据治理

Rights 保存 Usage Type、Territory、Duration、Exclusivity、Raw Footage 和 Cost；Cost 进入 Matrix 总预算。

Quote 保存 Creator Fee、Deliverables、Rights、Availability、Payment Terms、Valid Until、Currency、Status 和 Gmail Thread Reference。历史询价只能作为估算参考，不冒充当前有效 Quote。

Evidence 保存来源类型、URL、平台、发布日期、场景、形式、播放量、Proof Points、验证时间和 Stale 状态。推荐理由引用 Evidence ID，不能只有无法追溯的 AI Summary。

## 9. 技术架构

项目采用本地优先的 React + TypeScript + Vite 单页应用：

```text
UI / Agent Components
  页面、Timeline、Decision Card、Inspector、动效与中英文文案

Application State
  Campaign reducer、Agent Run、Action 和状态迁移

Domain
  Brief、Matrix、Search、Qualification、Review Projection、Gap 纯函数

Data
  固定 Seed、Zod 校验、localStorage 持久化与 Reset

Integrations
  明确标记的本地模拟适配器
```

关键边界：

- UI 不自行计算 CPM 或资格；计算进入 Domain 函数并有测试。
- 固定日期和 Seed 确保每次 Reset 的结果一致。
- v2 本地状态可恢复；旧版本 Welcome Message 也经过语言迁移处理。
- 默认英文，可一键切换中文；领域实体、Agent 消息和导航同步切换。
- `prefers-reduced-motion` 下移除人为等待和逐字动画，但保留阶段摘要。

项目刻意不引入后端、数据库、认证、通用规则引擎、事件总线或插件体系。对于本题验证目标，纯函数、Reducer 和固定数据更容易复现和审计。

## 10. 真实实现与模拟边界

### 已做成真实逻辑

- Brief 冲突确认与发布状态；
- 两套 Matrix、所有公式、硬约束、失败与恢复；
- Matrix Lock 和 Search Package 派生；
- 候选证据硬门禁、置信度和 Fit Score；
- 校准反馈与 30 + 10 扩展；
- Review Round 完整性校验；
- 内部到客户的字段白名单投影；
- Client Feedback、Gap、Backup Promotion 和 Replenishment；
- Agent Run、Step、Artifact 和本地持久化；
- 中英文切换、Agent 阶段动画与 reduced-motion；
- 一键测试和生产构建。

### 明确模拟

- 任意 Email、Excel、会议纪要的通用智能解析；
- 在线 LLM 推理；
- Creator 平台实时搜索、爬虫和视频识别；
- 实时报价、Gmail、飞书和 WhatsApp 外发；
- 真实客户访问和多人协作。

模拟能力接收结构化输入并产生可见状态，但不会伪装成已经连接真实外部服务。

### 设计覆盖但未做完整编辑器

- Brief v2 的通用字段编辑；
- Matrix Replan 的任意行编辑与完整 Fork UI；
- 多个真实客户 Review Round；
- Outreach、合同、付款、内容发布和效果归因。

## 11. 失败处理与安全

本题只实现能证明核心判断的失败路径：

- Matrix 数字无效、播放为零或硬约束失败时禁止锁定；
- 已锁定 Matrix 不因反馈被原地修改；
- 缺少真实骑行时直接失败，缺资料时进入 Needs Review；
- 30 人和 10 Backup 不完整时禁止发布；
- 客户投影只允许白名单字段；
- Agent Turn 运行期间禁止重复提交；
- Reset 或切换 Campaign 时取消未完成的本地动画/Turn；
- 外部模拟失败不改变已成功的领域状态。

没有为低概率组合构建通用恢复框架，以免在限时作业中牺牲可维护性。

## 12. 测试策略

`npm test` 覆盖：

- Matrix 行成本、播放量、CPM 和 Blended CPM；
- 预算、播放、CPM、YouTube、长视频、市场和场景约束；
- Rights 计入预算与锁定失败；
- Matrix 到 Search Package；
- 真实骑行资格、摩托车反例和缺失证据；
- 校准反馈和 30 + 10 扩展；
- 客户投影不泄露内部字段；
- Client Feedback 到 Gap、Backup 与 Replenishment；
- Agent 完整闭环、交互引导、滚动、阶段动画和本地状态；
- 默认英文与中英文切换。

`npm run build` 同时执行 TypeScript 编译与 Vite 生产构建。

当前没有 Playwright 浏览器 E2E，因此自动化测试不能替代最终人工点击验收。完整人工顺序见 `docs/最终验收记录.md`。

## 13. AI 使用与控制

AI 用于需求拆解、方案讨论、公式与测试草拟、UI 探索和文档整理。运行时 Demo 不依赖在线模型。

项目拒绝了以下建议：让 AI 成为最终 Creator 选择者、用黑箱综合分覆盖硬门禁、假装通用抽取可靠、引入超出题目需要的通用 Workflow / Event Store / Connector Framework，以及客户反馈后静默修改 Locked Matrix。

完整记录、Bad Case 和验证方式见 `decision.md`。

## 14. 风险与后续生产化

当前 Demo 能证明产品判断和工程边界，但不能证明生产容量。若进入正式建设，优先级为：

1. 服务端持有 Campaign 状态和不可变版本；
2. 真实身份、角色和审计时间；
3. 材料抽取与人工确认的模型评测集；
4. Creator 数据源、报价和外部通信适配器；
5. 线上观测、幂等、失败重试和数据新鲜度；
6. 浏览器 E2E、无障碍和真实用户可用性测试。

这些不是当前作业的隐含完成项。当前交付的目标是让评审能够稳定复现：系统理解了业务闭环，关键判断是真实、可解释和可测试的。
