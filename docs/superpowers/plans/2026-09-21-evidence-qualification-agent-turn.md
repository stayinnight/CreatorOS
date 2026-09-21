# Evidence Qualification Studio 与 Agent Turn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 Campaign Agent Desk 的右侧 Inspector 内完成可解释的 Creator 资格校准闭环，并让所有 Agent 问答呈现真实的“理解任务 → 工具检查 → 打字机回答”过程。

**Architecture:** 领域层用纯函数生成 `QualificationResult`、校准门槛、偏好影响和稳定排序；reducer 是审阅、偏好和 Artifact 的唯一持久化写入口。Agent Turn 将“立即追加用户消息”和“完成领域动作/答案”拆开，React hook 只管理瞬时阶段与计时器，完成轨迹写入 state，Inspector 与 Timeline 只消费结构化结果。

**Tech Stack:** React 19.3、TypeScript 5.7、Vite 5.4、Vitest 2.1、Zod 4.6、原生 CSS。

## Global Constraints

- 开始实现前必须使用 `using-git-worktrees` 在隔离 worktree 中工作。
- 必须先写失败测试，再写最小实现；每个任务独立通过并提交。
- 不接入在线 LLM、真实 Creator API、视频识别、后端或新依赖。
- 校准只在当前右侧 Inspector 内实现，不新增页面、Tab 或全屏审核模式。
- 骑行头戴摄像头证据是资格核心；Fit Score 永远不能覆盖硬门禁失败。
- Agent 只展示真实任务理解和实际执行摘要，不展示隐藏思维链，不伪造工具调用。
- P0 完成后立即进入整体验收；P1 动效增强不阻塞交付。
- 正文不低于 14px，辅助文字不低于 12px；正常动画仅使用 opacity/transform。
- `prefers-reduced-motion: reduce` 下取消人为等待和逐字动画，但功能与内容完全相同。

---

## File Structure

### 新增文件

- `src/domain/qualification.ts`：六项 Gate、Evidence 置信度、Fit Score 和最终资格结论。
- `src/agent/calibrationReview.ts`：校准审阅门槛、Reject 影响预览、偏好应用与稳定重排。
- `src/agent/agentTurn.ts`：问题类型到真实工具步骤的映射及完成轨迹。
- `src/components/agent/useAgentTurn.ts`：唯一 active turn、定时推进、取消和 reduced-motion。
- `src/components/agent/AgentTurnTrace.tsx`：运行阶段与完成后折叠轨迹。
- `src/components/agent/TypewriterAnswer.tsx`：答案逐字展示与 reduced-motion 降级。
- `src/components/agent/QualificationInspector.tsx`：单候选资格、Gate、Evidence、评分和 Agent 快捷问题。
- `src/components/agent/CalibrationActions.tsx`：Accept / Reject / Follow-up、影响预览和校准批准。
- `src/tests/qualification.test.ts`：资格与评分表驱动测试。
- `src/tests/calibrationReview.test.ts`：校准门槛、偏好、幂等与排序测试。
- `src/tests/agentTurn.test.ts`：Turn 规划和 reducer 生命周期测试。
- `src/tests/agentTurnUi.test.tsx`：阶段、打字机、取消和 reduced-motion 组件测试。
- `src/tests/qualificationInspector.test.tsx`：Inspector 内容与交互测试。

### 修改文件

- `src/domain/model.ts`：增加 Gate、QualificationResult 与 CalibrationReview 类型。
- `src/domain/candidate.ts`：保留兼容导出，将资格与评分委托给新领域模块。
- `src/agent/model.ts`：增加 AgentTurnRecord、校准审阅、偏好和当前候选字段。
- `src/agent/calibration.ts`：使用新的资格结果生成 8 + 2 样本。
- `src/agent/seed.ts`、`src/data/seedSchema.ts`：初始化并校验新增持久化字段。
- `src/app/campaignReducer.ts`：拆分 Turn action，接入审阅、偏好应用和批准门槛。
- `src/components/agent/AgentComposer.tsx`：提交给 `useAgentTurn`，移除固定 650ms 假等待。
- `src/components/agent/AgentTimeline.tsx`：渲染 active trace、完成轨迹与打字机答案。
- `src/components/agent/CandidateBatchDetail.tsx`：由卡片墙改为 Inspector 内的校准工作台。
- `src/components/agent/ArtifactInspector.tsx`：为 Candidate Batch 提供固定头部/底部布局。
- `src/components/agent/useChatScroll.ts`：Turn 内容增长时尊重 pinned 状态，并暴露“回到最新”。
- `src/pages/CampaignDeskPage.tsx`：在 Timeline 与 Composer 之间共享 Turn controller。
- `src/styles.css`：Inspector、Trace、打字机、状态和响应式样式。
- 现有 `src/tests/candidate.test.ts`、`src/tests/calibrationFlow.test.ts`、`src/tests/agentWorking.test.tsx`、`src/tests/chatScroll.test.tsx`：迁移既有断言。

---

### Task 1: 建立可解释的资格与评分领域模型

**Files:**
- Create: `src/domain/qualification.ts`
- Modify: `src/domain/model.ts`
- Modify: `src/domain/candidate.ts`
- Test: `src/tests/qualification.test.ts`
- Modify: `src/tests/candidate.test.ts`

**Interfaces:**
- Consumes: `CampaignCandidate`、`SearchPackage`、`Evidence`。
- Produces: `qualifyCandidateDetailed(candidate, searchPackage): QualificationResult`、`scoreQualifiedCandidate(candidate, result): FitScore | null`。

- [ ] **Step 1: 写六项 Gate、置信度和新权重的失败测试**

```ts
import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";
import { generateSearchPackages } from "../domain/search";
import { qualifyCandidateDetailed, scoreQualifiedCandidate } from "../domain/qualification";

const packages = generateSearchPackages({ ...campaignSeed.matrixScenarios[0], status: "Locked", version: 1 });
const qualificationFor = (id: string) => {
  const candidate = campaignSeed.candidates.find((item) => item.id === id)!;
  const pkg = packages.find((item) => item.matrixCellId === candidate.matrixCellId)!;
  return { candidate, result: qualifyCandidateDetailed(candidate, pkg) };
};

describe("evidence qualification", () => {
  it("disqualifies motorcycle-only proof even when production is high", () => {
    const { candidate, result } = qualificationFor("creator-moto-only");
    expect(result.status).toBe("Disqualified");
    expect(result.gates.find((gate) => gate.id === "real-cycling")?.status).toBe("Fail");
    expect(scoreQualifiedCandidate(candidate, result)).toBeNull();
  });

  it("routes missing evidence to review", () => {
    expect(qualificationFor("creator-missing-evidence").result.status).toBe("Needs Review");
  });

  it("uses 30/25/15/15/10/5 weights only after qualification", () => {
    const { candidate, result } = qualificationFor(campaignSeed.candidates[0].id);
    const score = scoreQualifiedCandidate(candidate, result)!;
    expect(score.weights).toEqual({ relevance: 30, povEvidence: 25, production: 15, stability: 15, commercial: 10, audience: 5 });
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: 运行测试并确认因模块不存在而失败**

Run: `npm test -- src/tests/qualification.test.ts`  
Expected: FAIL，提示无法解析 `../domain/qualification`。

- [ ] **Step 3: 增加精确类型并实现最小纯函数**

```ts
export type GateStatus = "Pass" | "Review" | "Fail";
export type EvidenceConfidence = "High" | "Medium" | "Low";

export interface GateResult {
  id: "market" | "platform-format" | "real-cycling" | "scenario" | "head-camera-proof" | "commercial";
  label: string;
  status: GateStatus;
  ruleId: string;
  evidenceIds: string[];
  summary: string;
}

export interface FitScore {
  total: number;
  weights: { relevance: 30; povEvidence: 25; production: 15; stability: 15; commercial: 10; audience: 5 };
  breakdown: Record<"relevance" | "povEvidence" | "production" | "stability" | "commercial" | "audience", number>;
}

export interface QualificationResult {
  candidateId: string;
  status: QualificationStatus;
  confidence: EvidenceConfidence;
  gates: GateResult[];
  evidenceIds: string[];
  risks: string[];
  score: FitScore | null;
}
```

`qualifyCandidateDetailed` 必须按以下优先级汇总：任一不可放宽 Gate 为 Fail → `Disqualified`；否则任一 Gate 为 Review → `Needs Review`；否则 `Qualified`。`head-camera-proof` 至少匹配 `First-person POV`、`Stabilization`、`Low Light` 或 `Hands-free Mounting` 中一项；过期 Evidence 不能贡献 High confidence。报价超上限或 Estimated 使 commercial Gate 为 Review，不直接淘汰。

- [ ] **Step 4: 保留旧接口兼容并运行领域测试**

```ts
export function qualifyCandidate(candidate: CampaignCandidate, searchPackage: SearchPackage): Qualification {
  const result = qualifyCandidateDetailed(candidate, searchPackage);
  return {
    status: result.status,
    reasons: result.gates.filter((gate) => gate.status !== "Pass").map((gate) => gate.summary),
    risks: result.risks,
  };
}

export function candidateScore(candidate: CampaignCandidate) {
  return calculateFitScore(candidate);
}
```

`calculateFitScore` 是 `qualification.ts` 内部的无门禁计算函数；`scoreQualifiedCandidate` 仅在 `result.status === "Qualified"` 时返回它，否则返回 `null`。这样旧排序调用可继续工作，新资格流程则不会让分数覆盖门禁。

Run: `npm test -- src/tests/qualification.test.ts src/tests/candidate.test.ts`  
Expected: PASS；摩托车样本为 Disqualified，缺证据样本为 Needs Review，权重总和为 100。

- [ ] **Step 5: 提交领域模型**

```bash
git add src/domain/model.ts src/domain/qualification.ts src/domain/candidate.ts src/tests/qualification.test.ts src/tests/candidate.test.ts
git commit -m "feat: add evidence-based candidate qualification"
```

---

### Task 2: 实现校准审阅、影响预览与批准门槛

**Files:**
- Create: `src/agent/calibrationReview.ts`
- Modify: `src/agent/model.ts`
- Modify: `src/agent/calibration.ts`
- Modify: `src/agent/seed.ts`
- Modify: `src/data/seedSchema.ts`
- Modify: `src/app/campaignReducer.ts`
- Modify: `src/components/agent/CandidateBatchDetail.tsx`
- Test: `src/tests/calibrationReview.test.ts`
- Modify: `src/tests/calibrationFlow.test.ts`

**Interfaces:**
- Consumes: `QualificationResult[]`、`CampaignCandidate[]`、`CalibrationReview[]`、`CampaignPreference[]`。
- Produces: `previewRejectImpact`、`applyPreference`、`rankCandidates`、`getCalibrationReadiness`。

- [ ] **Step 1: 写审阅门槛、偏好幂等和稳定重排失败测试**

```ts
it("requires 3 reviews, 2 accepted qualified candidates, one failure and preference confirmation", () => {
  const readiness = getCalibrationReadiness(reviews, qualificationById, { preferenceConfirmed: true });
  expect(readiness).toEqual({ ready: true, reviewed: 3, acceptedQualified: 2, reviewedFailure: true, preferenceConfirmed: true, blockers: [] });
});

it("updates an existing preference instead of duplicating it", () => {
  const first = applyPreference([], previewRejectImpact("creator-05", "Too commercial", candidates));
  const second = applyPreference(first, previewRejectImpact("creator-05", "Too commercial", candidates));
  expect(second).toHaveLength(1);
});

it("treats no-real-cycling as a qualification correction", () => {
  expect(previewRejectImpact("creator-05", "No real cycling", candidates).kind).toBe("QualificationCorrection");
});

it("builds exactly 30 primaries and 10 backups from the confirmed ranking", () => {
  const slate = buildApprovedSlate(candidates, qualificationById, preferences);
  expect(slate.filter((item) => item.role === "Primary")).toHaveLength(30);
  expect(slate.filter((item) => item.role === "Backup")).toHaveLength(10);
  expect(slate.every((item) => qualificationById[item.id].status === "Qualified")).toBe(true);
});
```

- [ ] **Step 2: 运行测试并确认接口缺失**

Run: `npm test -- src/tests/calibrationReview.test.ts`  
Expected: FAIL，提示导出不存在。

- [ ] **Step 3: 增加持久化模型和纯函数**

```ts
export type CalibrationDecision = "Accepted" | "Rejected" | "NeedsFollowUp";
export type RejectReason = "No real cycling" | "Too commercial" | "Not enough POV evidence" | "Audience mismatch" | "Quote too high";

export interface CalibrationReview {
  candidateId: string;
  decision: CalibrationDecision;
  reason: RejectReason | null;
  reviewedAt: string;
}

export interface CampaignPreference {
  id: string;
  label: string;
  strength: number;
  affectedCandidateIds: string[];
}
```

将 `AgentWorkspaceState` 的 `calibrationFeedback` 迁移为 `calibrationReviews`，将 `campaignPreferences: string[]` 迁移为结构化数组，并加入 `calibrationPreferenceConfirmed` 与 `calibrationSelectedCandidateId`。本任务同步把 `CandidateBatchDetail` 的旧反馈读取改为从 reviews 派生，保证该提交可独立构建。Zod 中数组字段使用 `.optional().default([])`、布尔字段使用 `.optional().default(false)`、候选字段使用 `.optional().default(null)`；旧字符串 preference 用 `z.union([z.string(), campaignPreferenceSchema]).transform(...)` 转为结构化 preference，保证旧 localStorage 可读取。

- [ ] **Step 4: 拆分预览和应用 action**

```ts
| { type: "REVIEW_CALIBRATION_CANDIDATE"; candidateId: string; decision: CalibrationDecision; reason?: RejectReason }
| { type: "APPLY_CALIBRATION_PREFERENCE"; impact: PreferenceImpact }
| { type: "CONFIRM_NO_CALIBRATION_ADJUSTMENT" }
| { type: "SELECT_CALIBRATION_CANDIDATE"; candidateId: string }
| { type: "APPROVE_CALIBRATION" }
```

`REVIEW_CALIBRATION_CANDIDATE` 只保存审阅；普通 Reject 的偏好由确认后的 `APPLY_CALIBRATION_PREFERENCE` 写入。`APPROVE_CALIBRATION` 必须先调用 `getCalibrationReadiness`，未满足时追加 Exception 消息，不生成 `artifact-client-slate-v1`；满足后调用 `buildApprovedSlate`，只从 Qualified 候选中按硬门禁、Campaign 偏好、Fit Score、原始索引依次稳定排序，写入恰好 30 Primary + 10 Backup 后再注册 Artifact。

- [ ] **Step 5: 运行校准测试并确认全部通过**

Run: `npm test -- src/tests/calibrationReview.test.ts src/tests/calibrationFlow.test.ts`  
Expected: PASS；重复偏好不增加数量，失败样本已审阅，门槛不足不能批准。

- [ ] **Step 6: 提交校准状态机**

```bash
git add src/agent/calibrationReview.ts src/agent/model.ts src/agent/calibration.ts src/agent/seed.ts src/data/seedSchema.ts src/app/campaignReducer.ts src/components/agent/CandidateBatchDetail.tsx src/tests/calibrationReview.test.ts src/tests/calibrationFlow.test.ts
git commit -m "feat: add deterministic calibration review state"
```

---

### Task 3: 将 Candidate Batch 改造成 Inspector 内校准工作台

**Files:**
- Create: `src/components/agent/QualificationInspector.tsx`
- Create: `src/components/agent/CalibrationActions.tsx`
- Modify: `src/components/agent/CandidateBatchDetail.tsx`
- Modify: `src/components/agent/ArtifactInspector.tsx`
- Test: `src/tests/qualificationInspector.test.tsx`

**Interfaces:**
- Consumes: Task 1 的 `QualificationResult`，Task 2 的 review/readiness/impact 接口。
- Produces: 候选序列导航、规则/证据/评分视图、审阅与批准事件。

- [ ] **Step 1: 写结构和行为失败测试**

```tsx
it("shows progress, six gates, evidence and no score for a disqualified candidate", () => {
  const html = renderCalibrationArtifactAt("creator-moto-only");
  expect(html).toContain("CALIBRATION ·");
  expect(html).toContain("真实自行车骑行");
  expect(html).toContain("Disqualified");
  expect(html).not.toContain("FIT / 100");
});

it("keeps the approval action disabled until readiness is satisfied", () => {
  const html = renderCalibrationArtifact();
  expect(html).toContain("还需审阅");
  expect(html).toContain("disabled");
});
```

- [ ] **Step 2: 运行测试并确认组件不存在**

Run: `npm test -- src/tests/qualificationInspector.test.tsx`  
Expected: FAIL，无法解析 `QualificationInspector`。

- [ ] **Step 3: 实现单候选内容区**

```tsx
export function QualificationInspector({ candidate, searchPackage, result, onAsk }: Props) {
  return <div className="qualification-workspace">
    <section className="qualification-verdict" aria-label="Agent verdict">
      <span>{result.status}</span>
      <strong>{result.confidence} confidence</strong>
      {result.risks.map((risk) => <p key={risk}>{risk}</p>)}
    </section>
    <section className="qualification-gates" aria-label="Qualification gates">
      {result.gates.map((gate) => <GateRow key={gate.id} gate={gate} />)}
    </section>
    <section className="qualification-evidence" aria-label="Evidence">
      {candidate.evidence.map((evidence) => <EvidenceCard key={evidence.id} evidence={evidence} />)}
    </section>
    {result.score && <FitScoreCard score={result.score} />}
    <section className="qualification-agent-prompts" aria-label="Ask Agent">
      {["为什么推荐他？", "哪条证据证明适合头戴摄像头？", "他有什么风险？", "找同一 Matrix Cell、但更生活化的候选"].map((prompt) =>
        <button key={prompt} type="button" onClick={() => onAsk(prompt, candidate.id)}>{prompt}</button>
      )}
    </section>
  </div>;
}
```

四个快捷问题必须携带 `candidateId`：推荐原因、头戴摄像头证据、风险、同 Cell 更生活化候选。

- [ ] **Step 4: 实现固定头部、序列导航和底部操作**

`CandidateBatchDetail` 默认选中保存的 `calibrationSelectedCandidateId` 或第一个未审阅候选；顶部显示 `CALIBRATION · N/10`、状态点、Previous/Next。`CalibrationActions` 在 Reject 时先显示 `PreferenceImpact`，只有点击“应用并重排”才 dispatch 偏好 action；完成审阅后移动到下一个未审阅候选。

- [ ] **Step 5: 运行组件与校准测试**

Run: `npm test -- src/tests/qualificationInspector.test.tsx src/tests/calibrationReview.test.ts`  
Expected: PASS；失败样本不显示 Fit Score，影响预览先于应用，重开后仍选中上次候选。

- [ ] **Step 6: 提交 Inspector 工作台**

```bash
git add src/components/agent/QualificationInspector.tsx src/components/agent/CalibrationActions.tsx src/components/agent/CandidateBatchDetail.tsx src/components/agent/ArtifactInspector.tsx src/tests/qualificationInspector.test.tsx
git commit -m "feat: build qualification calibration inspector"
```

---

### Task 4: 建立真实的 Agent Turn 规划与 reducer 生命周期

**Files:**
- Create: `src/agent/agentTurn.ts`
- Modify: `src/agent/model.ts`
- Modify: `src/data/seedSchema.ts`
- Modify: `src/agent/seed.ts`
- Modify: `src/app/campaignReducer.ts`
- Test: `src/tests/agentTurn.test.ts`

**Interfaces:**
- Consumes: `resolveAgentIntent`、CampaignState、可选 `candidateId`。
- Produces: `buildAgentTurnPlan`、`BEGIN_AGENT_TURN`、`COMPLETE_AGENT_TURN` 和 `AgentTurnRecord`。

- [ ] **Step 1: 写问题到工具步骤映射的失败测试**

```ts
it("plans only the real checks needed to explain a candidate", () => {
  const plan = buildAgentTurnPlan(campaignSeed, "为什么推荐他", { candidateId: "creator-01" });
  expect(plan.understanding).toBe("解释当前候选的推荐依据");
  expect(plan.steps.map((step) => step.kind)).toEqual(["ReadMatrixCell", "EvaluateQualification", "InspectEvidence", "SummarizeFit"]);
});

it("uses fewer checks for a budget question", () => {
  expect(buildAgentTurnPlan(campaignSeed, "他的预算风险？", { candidateId: "creator-01" }).steps.map((step) => step.kind))
    .toEqual(["ReadQuote", "CompareBudgetCeiling"]);
});
```

- [ ] **Step 2: 写 reducer 的立即用户消息/延迟答案测试**

```ts
it("appends the user message at begin and the answer plus trace at completion", () => {
  const begun = campaignReducer(campaignSeed, { type: "BEGIN_AGENT_TURN", turnId: "turn-1", text: "为什么推荐他", context: { candidateId: "creator-01" } });
  expect(begun.agent.messages.at(-1)?.role).toBe("User");
  const completed = campaignReducer(begun, { type: "COMPLETE_AGENT_TURN", turnId: "turn-1", text: "为什么推荐他", context: { candidateId: "creator-01" } });
  expect(completed.agent.turns.at(-1)?.status).toBe("Completed");
  expect(completed.agent.messages.at(-1)?.role).toBe("Agent");
});
```

- [ ] **Step 3: 运行测试并确认新接口缺失**

Run: `npm test -- src/tests/agentTurn.test.ts`  
Expected: FAIL，`buildAgentTurnPlan` 和新 actions 不存在。

- [ ] **Step 4: 实现精确 Turn 类型与映射**

```ts
export type AgentToolKind = "ReadMatrixCell" | "EvaluateQualification" | "InspectEvidence" | "SummarizeFit" | "ReadQuote" | "CompareBudgetCeiling" | "ApplyCampaignPreferences" | "ReadWorkflowState";
export interface AgentToolStepRecord { id: string; kind: AgentToolKind; label: string; inputRefs: string[]; summary: string; }
export interface AgentTurnRecord { id: string; query: string; status: "Completed" | "Failed"; understanding: string; steps: AgentToolStepRecord[]; ruleIds: string[]; evidenceIds: string[]; answerMessageId: string | null; error: string | null; }
```

在 `AgentWorkspaceState` 增加 `turns: AgentTurnRecord[]`，seed 初始化为空数组，Zod 使用 `.optional().default([])`；同时把 message type schema 与模型对齐，保留既有 `Progress` 并允许完成轨迹关联的消息。

`buildAgentTurnPlan` 必须按 resolved intent 选择 2–4 项步骤，不为了动画填充无关步骤。候选回答统一读取 Task 1 的结果，并把实际引用写入 `ruleIds` / `evidenceIds`；Find Similar 使用 Task 2 的稳定排序，无结果时返回缺少供给的具体 Matrix Cell。

- [ ] **Step 5: 将旧 `SEND_AGENT_MESSAGE` 逻辑拆成 begin/complete**

`BEGIN_AGENT_TURN` 只追加用户消息且幂等处理相同 `turnId`；`COMPLETE_AGENT_TURN` 执行原有 intent 对应的领域动作、追加答案和完成轨迹；`FAIL_AGENT_TURN` 保存失败步骤与错误；`RETRY_AGENT_TURN` 清除旧错误但不重复追加用户消息。保留 `SEND_AGENT_MESSAGE` 仅供旧测试/非动画入口兼容，并内部顺序调用相同 helper，禁止复制回答逻辑。

- [ ] **Step 6: 运行 Turn、intent 和 reducer 测试**

Run: `npm test -- src/tests/agentTurn.test.ts src/tests/agentIntent.test.ts src/tests/agentGuidance.test.ts`  
Expected: PASS；begin 后无 Agent 答案，complete 后只有一个答案与一个完成轨迹。

- [ ] **Step 7: 提交 Turn 领域生命周期**

```bash
git add src/agent/agentTurn.ts src/agent/model.ts src/agent/seed.ts src/data/seedSchema.ts src/app/campaignReducer.ts src/tests/agentTurn.test.ts
git commit -m "feat: model staged agent turns"
```

---

### Task 5: 实现阶段推进、打字机答案与折叠轨迹

**Files:**
- Create: `src/components/agent/useAgentTurn.ts`
- Create: `src/components/agent/AgentTurnTrace.tsx`
- Create: `src/components/agent/TypewriterAnswer.tsx`
- Modify: `src/components/agent/AgentWorking.tsx`
- Modify: `src/components/agent/AgentComposer.tsx`
- Modify: `src/components/agent/AgentTimeline.tsx`
- Modify: `src/components/agent/ArtifactInspector.tsx`
- Modify: `src/components/agent/CandidateBatchDetail.tsx`
- Modify: `src/components/agent/QualificationInspector.tsx`
- Modify: `src/pages/CampaignDeskPage.tsx`
- Test: `src/tests/agentTurnUi.test.tsx`
- Modify: `src/tests/agentWorking.test.tsx`

**Interfaces:**
- Consumes: Task 4 的 `buildAgentTurnPlan` 与 reducer actions。
- Produces: `AgentTurnController { activeTurn, revealingMessageId, submit, retry, cancel }`。

- [ ] **Step 1: 用 fake timers 写阶段顺序和 reduced-motion 失败测试**

```tsx
it("moves through understanding, tools and composing before completing", async () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useAgentTurn(state, dispatch));
  act(() => result.current.submit("为什么推荐他", { candidateId: "creator-01" }));
  expect(result.current.activeTurn?.phase).toBe("Understanding");
  await act(() => vi.advanceTimersByTimeAsync(350));
  expect(result.current.activeTurn?.phase).toBe("RunningTools");
  await act(() => vi.runAllTimersAsync());
  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "COMPLETE_AGENT_TURN" }));
});

it("completes immediately when reduced motion is requested", () => {
  mockReducedMotion(true);
  // submit 后同一 tick 完成，不启动逐字 timer
});
```

- [ ] **Step 2: 运行测试并确认 hook/组件不存在**

Run: `npm test -- src/tests/agentTurnUi.test.tsx`  
Expected: FAIL，无法解析新 hook。

- [ ] **Step 3: 实现单 active turn controller**

`useAgentTurn` 在 submit 时先 dispatch `BEGIN_AGENT_TURN`，再根据计划推进：Understanding 200–350ms；每项 tool 180–320ms；Composing 200ms；最后 dispatch `COMPLETE_AGENT_TURN`。所有 timer ID 放入一个 ref 集合，unmount、Reset 和新 Campaign 时统一 clear。active turn 存在时 `submit` 直接返回 false。

- [ ] **Step 4: 实现 Trace 和 Typewriter**

```tsx
export function TypewriterAnswer({ text, active, onComplete }: Props) {
  const reduced = useReducedMotion();
  const animatedIndex = useTypewriterIndex(text, active && !reduced, onComplete);
  const visible = reduced || !active ? text.length : animatedIndex;
  return <span>{text.slice(0, visible)}{active && visible < text.length && <span aria-hidden="true" className="typing-caret" />}</span>;
}
```

`useReducedMotion` 在 mount 时读取 `window.matchMedia("(prefers-reduced-motion: reduce)").matches`；`useTypewriterIndex` 每 18ms 增加 `Math.max(1, Math.ceil(text.length / 50))` 个字符，到达全文后只调用一次 `onComplete`，unmount 时清理 interval。

运行中 Trace 显示当前阶段、Running/Done；完成后默认折叠为 `使用 N 项工作区检查完成分析 · 查看过程`。屏幕阅读器通过一个 `aria-live="polite"` 区域接收阶段摘要，不逐字符朗读。

- [ ] **Step 5: 在页面共享 controller 并移除固定 650ms**

`CampaignDeskPage` 创建 controller，传给 `AgentTimeline`、`AgentComposer`，并以 `onAskAgent={controller.submit}` 继续传入 `ArtifactInspector → CandidateBatchDetail → QualificationInspector`。Composer 不再拥有 pending timer；用户消息来自 reducer，因此不会重复渲染 `pending-user-message`。答案完成打字后才允许对应 CTA 淡入。

- [ ] **Step 6: 运行 UI 与既有交互测试**

Run: `npm test -- src/tests/agentTurnUi.test.tsx src/tests/agentWorking.test.tsx src/tests/agentGuidance.test.ts`  
Expected: PASS；阶段顺序正确、只有一个 active turn、unmount 不补写旧结果、reduced-motion 立即完成。

- [ ] **Step 7: 提交 Agent 动效生命周期**

```bash
git add src/components/agent/useAgentTurn.ts src/components/agent/AgentTurnTrace.tsx src/components/agent/TypewriterAnswer.tsx src/components/agent/AgentWorking.tsx src/components/agent/AgentComposer.tsx src/components/agent/AgentTimeline.tsx src/components/agent/ArtifactInspector.tsx src/components/agent/CandidateBatchDetail.tsx src/components/agent/QualificationInspector.tsx src/pages/CampaignDeskPage.tsx src/tests/agentTurnUi.test.tsx src/tests/agentWorking.test.tsx
git commit -m "feat: stage agent tool calls and typed answers"
```

---

### Task 6: 修正 Turn 增长期间的聊天滚动行为

**Files:**
- Modify: `src/components/agent/useChatScroll.ts`
- Modify: `src/pages/CampaignDeskPage.tsx`
- Modify: `src/tests/chatScroll.test.tsx`

**Interfaces:**
- Consumes: `messageCount` 和 active turn 的 `contentRevision`。
- Produces: `showJumpToLatest`、`jumpToLatest()`，且内容增长只在 pinned 时滚到底部。

- [ ] **Step 1: 写 pinned/unpinned 的失败测试**

```tsx
it("keeps typing content visible only while the reader is pinned", () => {
  const { result, rerender } = renderScrollHook({ messageCount: 3, contentRevision: 0 });
  fireScroll(result.current.viewportRef, { distanceFromBottom: 200 });
  rerender({ messageCount: 3, contentRevision: 1 });
  expect(scrollTo).not.toHaveBeenCalled();
  expect(result.current.showJumpToLatest).toBe(true);
});
```

- [ ] **Step 2: 运行测试并确认签名不支持 contentRevision**

Run: `npm test -- src/tests/chatScroll.test.tsx`  
Expected: FAIL，hook 不接受第二个参数或没有 `showJumpToLatest`。

- [ ] **Step 3: 扩展 hook 并接入页面**

将 `useChatScroll(messageCount)` 改为 `useChatScroll({ messageCount, contentRevision })`。新消息和逐字内容增长都只在 `pinnedToBottomRef.current` 为 true 时滚动；用户离开底部后显示按钮，点击 `jumpToLatest` 后重新 pin。Inspector 的 revealKey 不进入依赖数组。

- [ ] **Step 4: 运行滚动测试**

Run: `npm test -- src/tests/chatScroll.test.tsx`  
Expected: PASS；pinned 时跟随打字，向上阅读时不抢位置，点击后回到底部。

- [ ] **Step 5: 提交滚动修复**

```bash
git add src/components/agent/useChatScroll.ts src/pages/CampaignDeskPage.tsx src/tests/chatScroll.test.tsx
git commit -m "fix: preserve chat position during agent turns"
```

---

### Task 7: 完成黑白圆角工作台与可访问动效

**Files:**
- Modify: `src/styles.css`
- Modify: `src/tests/qualificationInspector.test.tsx`
- Modify: `src/tests/agentTurnUi.test.tsx`

**Interfaces:**
- Consumes: 前述组件 class names 与状态属性。
- Produces: 响应式双列/单列 Inspector、固定头尾、Trace/typing 动效与 reduced-motion 样式。

- [ ] **Step 1: 增加语义状态与可访问性断言**

```tsx
expect(screen.getByRole("region", { name: "Qualification gates" })).toBeTruthy();
expect(screen.getByRole("button", { name: "下一个候选" })).toBeTruthy();
expect(screen.getByRole("status", { name: "Agent 执行状态" })).toHaveAttribute("aria-live", "polite");
```

- [ ] **Step 2: 运行组件测试并确认语义缺失**

Run: `npm test -- src/tests/qualificationInspector.test.tsx src/tests/agentTurnUi.test.tsx`  
Expected: FAIL，缺少对应 region/status/按钮标签。

- [ ] **Step 3: 添加 P0 样式和响应式规则**

```css
.calibration-shell { height: calc(100vh - 104px); display: grid; grid-template-rows: auto minmax(0, 1fr) auto; }
.calibration-candidate-nav, .calibration-action-bar { position: sticky; z-index: 2; background: rgba(255,255,255,.96); backdrop-filter: blur(12px); }
.qualification-workspace { display: grid; grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr); gap: 20px; padding: 22px; overflow-y: auto; }
.qualification-card, .agent-turn-trace { border: 1px solid var(--black); border-radius: var(--radius-surface); background: var(--white); }
.agent-tool-step { animation: turn-step-in 180ms ease both; }
.typing-caret { display: inline-block; width: 1px; height: 1em; margin-left: 2px; background: currentColor; animation: caret-blink .7s steps(1) infinite; }
@media (max-width: 1320px) { .qualification-workspace { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .agent-tool-step, .typing-caret, .typed-answer { animation: none !important; transition: none !important; } }
```

所有新正文使用现有 `--text-body`（14px 以上），辅助信息使用 `--text-meta`（12px 以上），操作使用 `--text-control`；状态同时提供文案和图标。

- [ ] **Step 4: 运行组件测试和构建**

Run: `npm test -- src/tests/qualificationInspector.test.tsx src/tests/agentTurnUi.test.tsx && npm run build`  
Expected: 两组测试 PASS；TypeScript 和 Vite build 成功。

- [ ] **Step 5: 提交视觉与可访问性**

```bash
git add src/styles.css src/tests/qualificationInspector.test.tsx src/tests/agentTurnUi.test.tsx
git commit -m "style: polish qualification and agent turn interactions"
```

---

### Task 8: 主链集成、回归与中文验收文档

**Files:**
- Modify: `README.md`
- Create: `docs/验收流程-资格校准与Agent交互.md`

**Interfaces:**
- Consumes: Tasks 1–7 的全部 P0 能力。
- Produces: 可重复的中文演示步骤和完整验证证据。

- [ ] **Step 1: 写中文演示与验收顺序**

文档必须包含：启动命令；Reset；推进到 Search Packages；开始 10 人校准；检查 Qualified 候选的六项 Gate 和头戴摄像头证据；询问“为什么推荐他”并观察阶段/工具/打字机；检查 Torque Atlas 被淘汰；Reject Too commercial 并预览/应用；满足门槛；扩展 30 + 10；进入客户投影校验。

- [ ] **Step 2: 运行完整自动化测试**

Run: `npm test`  
Expected: 所有 test files 和 tests PASS，无 unhandled error。

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`  
Expected: `tsc -b` 与 `vite build` 成功，生成 `dist/`。

- [ ] **Step 4: 检查 diff 和工作区**

Run: `git diff --check && git status --short`  
Expected: `git diff --check` 无输出；只出现本任务预期的 README/验收文档或尚未提交文件。

- [ ] **Step 5: 按中文流程手工验证 P0 主链**

Run: `npm run dev -- --host 0.0.0.0`  
Expected: 正常模式单个 Agent Turn 为约 1.2–2.2s；工具步骤与问题匹配；答案逐字出现后 CTA 淡入；聊天在底部时跟随、向上浏览时不抢位置；Inspector 关闭重开保留候选；校准门槛满足后生成 30 + 10。

- [ ] **Step 6: 提交验收文档**

```bash
git add README.md docs/验收流程-资格校准与Agent交互.md
git commit -m "docs: add qualification demo acceptance flow"
```

- [ ] **Step 7: 最终验证并记录准确结果**

Run: `npm test && npm run build && git diff --check && git status --short`  
Expected: 测试和构建均成功；worktree clean。最终汇报必须写实际 test file/test 数量，不使用预估数字。

---

## P1 延后清单（不进入本轮 P0 提交）

- 点击 Agent 引用后让对应 Evidence Card 短暂高亮。
- 候选切换时更丰富的错峰过渡。
- Needs follow-up 的自由文本说明和更多细分原因。
- 专门的工具失败注入开关；P0 只保留通用 Retry 机制和单测。

只有在 P0 全链通过、构建成功并完成手工演示后，才评估这些项目。
