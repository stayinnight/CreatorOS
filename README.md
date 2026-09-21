# Campaign Agent Desk

这是一个可在本地运行、结果可重复的 Creator Marketing Agent Demo，业务背景固定为**美国和英国市场的骑行头戴摄像头发布活动**。

产品形态不是多个功能模块的拼接，而是一个完整的 Agent 工作台：用户从待办 Inbox 进入 Campaign，向 Agent 提交客户材料；Agent 先给出计划，再执行低风险工作，并在需求冲突、Matrix 锁定、校准方向和客户发布等高影响节点暂停等待人工判断。Brief、Creator Mix、Search Package、候选人批次和客户反馈都作为带来源关系的 Artifact 在同一工作流中打开。

## 本地运行与验证

环境要求：Node 18.18+、npm。

```bash
npm install
npm run dev
```

打开 Vite 输出的本地地址。状态保存在 `localStorage`；左下角 **Reset demo** 可恢复固定初始数据。

提交或演示前执行：

```bash
npm test
npm run build
```

## 中文验收流程与演示顺序

1. 在 **Inbox** 打开 `Cycling Camera Launch`，说明这是需要人工判断的 Campaign，而不是功能导航页。
2. 点击 **Analyze 3 materials**，查看 Agent 对 Email、Excel、Meeting Notes 给出的执行计划，再点击 **Start run**。
3. 依次处理两张 Decision Card：上线周期选择 `8 weeks · Excel`；相邻运动范围选择 `Pending; excluded from current plan`。确认 Agent 在决策前不会越权推进。
4. 从右侧 Artifact 区打开 **Brief v1**，检查三份来源、两个已解决冲突，以及骑行头戴摄像头的市场、预算、播放量和证据要求。
5. 点击 **Build mix options**，打开 Mix Artifact；比较两个方向，先用 **Test failure** 制造长视频与场景覆盖缺口，确认无效 Matrix 不能锁定；再 **Restore**、锁定 Matrix，并生成 6 个有明确单元格来源的 Search Package。
6. 从 Search Package Artifact 点击 **Build calibration batch**。检查 10 人校准批次：8 个合格方向，以及摩托车冒充骑行、缺失证据两个显式反例。选择候选人并用固定原因 Reject，确认反馈只形成当前 Campaign 的偏好，不篡改 Brief 硬约束。
7. 点击 **Approve & expand**，由 Agent 生成 30 名客户候选人和 10 名内部 Backup；执行 **Validate slate**，先打开 **Client preview** 检查字段隔离，再批准发布 Round 1。
8. 在 Review Artifact 中点击 **Apply feedback**，模拟客户 Pass UK Urban 候选人。Gap Artifact 会定位受影响的 Matrix 单元格；先 **Promote backup**，再只为 UK Urban 创建 replenishment。确认 Brief 与锁定的 Mix 均未失效。
9. 打开 **Runs**，检查目标、当前/最终步骤、起止时间、Artifact 数量、失败信息和局部恢复轨迹。

## 验收重点

- 全局入口只有 Inbox、Campaigns、Runs；Campaign 默认打开 Agent Run，而不是仪表盘或功能 Tab。
- Agent 在运行前展示计划，在需求冲突和外部发布等高风险动作前暂停。
- Matrix 的预算、播放量、CPM、YouTube、长视频、US/UK、Road/MTB/Urban 约束都由真实领域逻辑计算；硬约束失败时不能锁定。
- 候选人必须有可核验的真实骑行证据；高播放量摩托车内容和无证据资料不会被悄悄放行。
- 客户首轮严格为 30 人，10 名 Backup 只在内部可见；Client Preview 使用显式字段白名单。
- 客户反馈只触发局部 Gap 和补量，不会回写 Brief 或破坏锁定 Matrix。
- Reset、v2 本地持久化、完整 Run History、自动化测试和生产构建均可用。

## Agent 能力边界

本 Demo 的 Agent 是**确定性的，不调用在线 AI 模型**。自然语言输入只支持界面中给出的有限意图，例如“先只整理 Brief”“为什么推荐他”“找相似但更生活化的人”；超出范围的输入会明确说明边界并给出可用建议，不会伪装成通用模型。

用户在 Decision Card、Matrix、校准和发布环节的操作会真实改变计算结果、状态迁移和下游 Artifact。飞书、Gmail、公开搜索、实时报价和真实外发均不在本地 Demo 中执行。

## 项目结构

- `src/agent/`：Run、Step、Decision、Artifact、有限意图与校准逻辑。
- `src/domain/`：Brief、Matrix、候选人资格、客户投影与 Gap 计算。
- `src/components/agent/`：Agent Timeline、消息卡、Context Rail 和 Artifact Inspector。
- `src/data/seed.ts`：固定 Campaign、Matrix 与 42 名候选人数据。
- `src/tests/`：覆盖领域规则、完整 Agent 闭环、投影安全和持久化迁移。
