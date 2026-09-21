# Creator Mix Planner

这是一个可在本地运行、结果可重复的达人营销规划 Demo，服务于**美国和英国市场的骑行头戴摄像头发布活动**。它完整串起了：多来源需求整理、冲突确认、达人矩阵锁定、证据校验、客户反馈和定向补量。

本项目重点做深 Matrix：成本、播放量、CPM、覆盖约束、版本锁定、搜索包生成、预测缺口和修复动作都由真实的 TypeScript 领域逻辑计算。飞书、Gmail、公开搜索和报价收集均明确标注为模拟能力。

## 本地运行与验证

环境要求：Node 18.18+、npm。

```bash
npm install
npm run dev
```

打开 Vite 在终端中输出的本地地址。操作状态会保存在 `localStorage` 中；如需重新演示，点击页面右上角的 **Reset demo**，即可恢复到固定初始数据。

提交或演示前，执行完整验证：

```bash
npm test
npm run build
```

预期结果：`npm test` 显示 10 个测试文件、22 项测试全部通过；`npm run build` 成功生成 `dist/` 产物。

## 5–8 分钟演示顺序

### 1. Overview：先讲清业务背景

进入 **Overview**，先说明这不是通用达人 CRM，而是针对骑行头戴摄像头的决策闭环。核心要求不是泛运动流量，而是创作者必须在真实的 Road、MTB、Urban 骑行场景中证明第一人称拍摄、稳定、防护记录和不同光线表现。

### 2. Brief：展示需求冲突如何被显式解决

进入 **Brief**，依次说明 Email、Excel 和 Meeting Notes 三个来源。现场处理两个冲突：

- 上线周期选择 **8 weeks · Excel**；
- Motorcycle / Skiing 选择 **Pending; excluded from current plan**。

两个冲突解决后发布 Brief v1。这里要强调：系统不会悄悄替客户做决定，存在冲突就必须留下明确结论和来源。

### 3. Mix Planner：演示本次做深的核心能力

进入 **Mix Planner**，先比较两个方案：

- **Credibility First**：用长视频建立可信度；
- **Reach Efficiency**：保留长视频底线，同时增加短视频触达。

在 Scenario A 中点击 **Simulate long-form gap**，观察长视频达人数量和 UK / Urban 覆盖不足，锁定按钮被硬约束阻止。随后点击 **Restore scenario** 恢复方案，确认预算、播放量、CPM、YouTube、长视频数量、国家和骑行场景全部通过，再执行：

1. **Lock Matrix v1**；
2. **Generate search packages**。

最终生成 6 个与 Matrix 单元格一一关联的搜索包。

### 4. Search & Candidates：证明没有 AI 模型也能稳定做资格判断

进入 **Search & Candidates**，先查看每个搜索包的目标人数、候选人数、单人预算上限、最低播放量、证据要求和排除规则，然后点击 **Load 2 seeded batches** 加载 42 个固定候选人。

重点打开两个反例：

- **Torque Atlas**：播放量很高，但只有摩托车内容，没有真实骑行证据，因此被判定为 Disqualified；
- **Open Air Edit**：没有可核验内容证据，因此进入 Needs Review，而不是由系统猜测通过。

再打开一个正常候选人，展示真实骑行证据、透明加权评分、报价、版权成本和 Matrix 单元格预算上限。

### 5. Client Review：展示 30 + 10 和信息隔离

进入 **Client Review**，在 Internal 视图确认：

- 客户首轮正好 30 名合格达人；
- 内部保留 10 名合格 Backup；
- 投影检查为 PASS。

点击 **Publish Round 1** 并切换到 Client projection。说明客户只能看到达人信息、骑行证据、交付物、报价区间、版权摘要和决策按钮；内部评分细项、历史价格、内部备注、付款条款和 Backup 策略不会泄漏。

### 6. Feedback → Gap → Recovery：完成最小业务闭环

点击 **Apply & submit seeded feedback**，模拟客户 Pass 掉 UK Urban 候选人。系统只重新计算 Forecast，不修改已经锁定的 Matrix，并明确显示缺失的创作者数量和播放量。

按推荐顺序执行：

1. **Promote backup**：优先晋升现有合格备选，避免破坏原计划；
2. **Create replenishment**：为仍然缺人的 Matrix 单元格创建一个带父子关系的补量搜索包。

到这里，Brief → Matrix → Search Package → Candidate → Client Feedback → Gap → Recovery 的闭环完成。

### 7. Activity：用审计记录收尾

进入 **Activity**，展示 Brief 发布、Matrix 锁定、搜索包生成、候选批次加载、客户评审发布、反馈提交、Backup 晋升和补量任务创建的时间线。右侧飞书与 Gmail 仅为明确标注的模拟预览，不会真的发送外部消息。

## 验收清单

- 总预算不超过 180,000 美元，并且包含版权成本；预计播放量不少于 260 万；混合 CPM 不高于 70 美元。
- 方案必须包含 YouTube，至少有 3 名长视频达人，同时覆盖 US / UK 和 Road / MTB / Urban。
- Brief 冲突未解决时不能发布；Matrix 硬约束未通过时不能锁定。
- 每个搜索包都保留 Brief、Matrix 版本和 Matrix 单元格的来源关系。
- 真实骑行证据是硬门槛；摩托车内容和缺失证据不能悄悄进入客户名单。
- 第一轮客户名单必须正好 30 人，内部另有至少 10 名合格备选。
- 客户视图使用显式字段白名单，并有自动化测试防止内部敏感字段泄漏。
- 客户反馈只改变预测结果，不会回写或篡改锁定后的 Matrix。
- 出现缺口时先晋升匹配的 Backup；仍有缺口才创建补量搜索包。
- 点击 **Reset demo** 后可以恢复固定初始数据，重新完整演示。
- 执行 `npm test` 和 `npm run build` 均成功。

## 范围边界

已实现：单一固定 Campaign、两个 Matrix 场景、确定性数据、纯领域计算、达人证据与资格校验、客户安全投影、缺口修复、本地持久化和响应式界面。

未实现：后端、登录鉴权、数据库、在线 AI 提取、实时达人搜索、爬虫、真实消息发送、报价谈判、通用工作流引擎和生产级并发。这些是为了保证 12 小时内交付高质量闭环而主动控制的范围，不是隐藏的 Mock。

## 项目结构

- `src/domain/`：可测试的业务规则与计算逻辑。
- `src/data/seed.ts`：包含 42 名候选人的固定 Campaign 数据。
- `src/pages/`：六个业务页面。
- `src/tests/`：覆盖公式、门禁、客户投影、持久化和完整闭环。
- `fixtures/search-package.example.json`：一个真实生成的下游 Search Package 示例。
- `decision.md`：产品与工程取舍、AI 使用边界。
- `docs/superpowers/specs/`：已确认的产品规格。
