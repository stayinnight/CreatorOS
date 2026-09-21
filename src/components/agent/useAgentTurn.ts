import { useCallback, useEffect, useRef, useState, type Dispatch } from "react";
import { buildAgentTurnPlan, buildCampaignActionTurnPlan, type AgentTurnContext, type AgentTurnPlan } from "../../agent/agentTurn";
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

  const stage = useCallback((turn: ActiveAgentTurn, finish: () => void) => {
    clearTimers(); setActiveTurn(turn);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const understandMs = reduced ? 180 : 340;
    const toolMs = reduced ? 150 : 320;
    const composeMs = reduced ? 180 : 320;
    let elapsed = understandMs;
    timers.current.push(window.setTimeout(() => setActiveTurn((current) => current && { ...current, phase: "RunningTools" }), elapsed));
    turn.plan.steps.forEach((_, index) => { elapsed += toolMs; timers.current.push(window.setTimeout(() => setActiveTurn((current) => current && { ...current, completedStepCount: index + 1 }), elapsed)); });
    elapsed += composeMs;
    timers.current.push(window.setTimeout(() => setActiveTurn((current) => current && { ...current, phase: "Composing" }), elapsed));
    elapsed += composeMs;
    timers.current.push(window.setTimeout(() => { finish(); setActiveTurn((current) => current && { ...current, phase: "Completed" }); }, elapsed));
    timers.current.push(window.setTimeout(() => setActiveTurn(null), elapsed + (reduced ? 350 : 900)));
  }, [clearTimers]);

  const submit = useCallback((text: string, context?: AgentTurnContext) => {
    if (!text.trim() || activeTurn) return false;
    const id = `turn-${Date.now()}-${state.agent.messages.length}`;
    const plan = buildAgentTurnPlan(state, text, context);
    dispatch({ type: "BEGIN_AGENT_TURN", turnId: id, text, context });
    stage({ id, text, context, plan, phase: "Understanding", completedStepCount: 0 }, () => {
      dispatch({ type: "COMPLETE_AGENT_TURN", turnId: id, text, context }); setRevealingTurnId(id);
    });
    return true;
  }, [activeTurn, dispatch, stage, state]);

  const performAction = useCallback((action: CampaignAction) => {
    if (activeTurn) return false;
    const id = `action-${action.type}-${Date.now()}`;
    const plan = buildCampaignActionTurnPlan(action.type);
    stage({ id, text: plan.understanding, plan, phase: "Understanding", completedStepCount: 0 }, () => dispatch(action));
    return true;
  }, [activeTurn, dispatch, stage]);

  return { activeTurn, revealingTurnId, submit, performAction, busy: Boolean(activeTurn) };
}

export type AgentTurnController = ReturnType<typeof useAgentTurn>;
