import { useCallback, useEffect, useRef, useState, type Dispatch } from "react";
import { buildAgentTurnPlan, type AgentTurnContext, type AgentTurnPlan } from "../../agent/agentTurn";
import type { CampaignAction } from "../../app/campaignReducer";
import type { CampaignState } from "../../domain/model";
import type { AgentTurnPhase } from "./AgentTurnTrace";

export interface ActiveAgentTurn { id: string; text: string; context?: AgentTurnContext; plan: AgentTurnPlan; phase: AgentTurnPhase; completedStepCount: number }

export function useAgentTurn(state: CampaignState, dispatch: Dispatch<CampaignAction>) {
  const [activeTurn, setActiveTurn] = useState<ActiveAgentTurn | null>(null);
  const [revealingTurnId, setRevealingTurnId] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const clearTimers = useCallback(() => { timers.current.forEach(window.clearTimeout); timers.current = []; }, []);
  useEffect(() => clearTimers, [clearTimers]);
  const submit = useCallback((text: string, context?: AgentTurnContext) => {
    if (!text.trim() || activeTurn) return false;
    clearTimers();
    const id = `turn-${Date.now()}-${state.agent.messages.length}`;
    const plan = buildAgentTurnPlan(state, text, context);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    dispatch({ type: "BEGIN_AGENT_TURN", turnId: id, text, context });
    setActiveTurn({ id, text, context, plan, phase: "Understanding", completedStepCount: 0 });
    if (reduced) { dispatch({ type: "COMPLETE_AGENT_TURN", turnId: id, text, context }); setRevealingTurnId(id); setActiveTurn(null); return true; }
    let elapsed = 280;
    timers.current.push(window.setTimeout(() => setActiveTurn((turn) => turn && { ...turn, phase: "RunningTools" }), elapsed));
    plan.steps.forEach((_, index) => { elapsed += 230; timers.current.push(window.setTimeout(() => setActiveTurn((turn) => turn && { ...turn, completedStepCount: index + 1 }), elapsed)); });
    elapsed += 220;
    timers.current.push(window.setTimeout(() => setActiveTurn((turn) => turn && { ...turn, phase: "Composing" }), elapsed));
    elapsed += 260;
    timers.current.push(window.setTimeout(() => { dispatch({ type: "COMPLETE_AGENT_TURN", turnId: id, text, context }); setRevealingTurnId(id); setActiveTurn((turn) => turn && { ...turn, phase: "Completed" }); }, elapsed));
    timers.current.push(window.setTimeout(() => setActiveTurn(null), elapsed + 1100));
    return true;
  }, [activeTurn, clearTimers, dispatch, state]);
  return { activeTurn, revealingTurnId, submit, busy: Boolean(activeTurn) };
}

export type AgentTurnController = ReturnType<typeof useAgentTurn>;
