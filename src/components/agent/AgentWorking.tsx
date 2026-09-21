export function workingStagesFor(input: string) {
  const text = input.toLowerCase();
  if (text.includes("只整理 brief")) return ["理解范围变更", "重排当前步骤", "生成 Revised Plan"];
  if (/预算|市场|目标|证据|matrix/.test(text)) return ["识别 Campaign 数据", "读取当前状态", "组织可核验结果"];
  if (/推荐|相似/.test(text)) return ["读取候选人上下文", "核对证据与 Matrix", "生成解释"];
  return ["理解当前意图", "核对工作流状态", "准备下一步"];
}

export function AgentWorking({ input }: { input: string }) {
  return <div className="turn-transition" aria-live="polite"><div className="pending-user-message">{input}</div><section className="agent-working"><header><span className="working-mark" /><strong>Agent working</strong></header>{workingStagesFor(input).map((stage, index) => <div key={stage} style={{ animationDelay: `${index * 120}ms` }}><i>{index + 1}</i><span>{stage}</span></div>)}</section></div>;
}
