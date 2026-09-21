import { campaignSeed } from "../data/seed";
import { publishBrief, resolveConflict } from "../domain/brief";
import { lockMatrix } from "../domain/matrix";
import type { CampaignState, MatrixRow } from "../domain/model";
import { generateSearchPackages } from "../domain/search";

export type CampaignAction =
  | { type: "RESET" }
  | { type: "RESOLVE_CONFLICT"; conflictId: string; resolution: string }
  | { type: "PUBLISH_BRIEF" }
  | { type: "SELECT_SCENARIO"; scenarioId: string }
  | { type: "UPDATE_MATRIX_ROW"; scenarioId: string; row: MatrixRow }
  | { type: "SIMULATE_LONG_FORM_GAP"; scenarioId: string }
  | { type: "RESTORE_SCENARIO"; scenarioId: string }
  | { type: "LOCK_MATRIX"; scenarioId: string }
  | { type: "GENERATE_PACKAGES"; scenarioId: string }
  | { type: "LOAD_BATCHES" };

function activity(message: string) {
  return { id: `activity-${message.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`, at: "2026-09-21T10:00:00+08:00", kind: "Planning", message, status: "Success" as const };
}

export function campaignReducer(state: CampaignState, action: CampaignAction): CampaignState {
  switch (action.type) {
    case "RESET": return structuredClone(campaignSeed);
    case "RESOLVE_CONFLICT": return { ...state, brief: resolveConflict(state.brief, action.conflictId, action.resolution) };
    case "PUBLISH_BRIEF": return { ...state, brief: publishBrief(state.brief), activity: [...state.activity, activity("Brief v1 published")] };
    case "SELECT_SCENARIO": return { ...state, activeScenarioId: action.scenarioId };
    case "UPDATE_MATRIX_ROW": return {
      ...state,
      matrixScenarios: state.matrixScenarios.map((scenario) => scenario.id === action.scenarioId
        ? { ...scenario, rows: scenario.rows.map((row) => row.id === action.row.id ? action.row : row) }
        : scenario),
    };
    case "SIMULATE_LONG_FORM_GAP": return {
      ...state,
      matrixScenarios: state.matrixScenarios.map((scenario) => scenario.id === action.scenarioId
        ? { ...scenario, rows: scenario.rows.map((row) => row.id === "us-mtb-youtube" || row.market === "UK" ? { ...row, plannedCreators: 0 } : row) }
        : scenario),
    };
    case "RESTORE_SCENARIO": {
      const original = campaignSeed.matrixScenarios.find((scenario) => scenario.id === action.scenarioId)!;
      return { ...state, matrixScenarios: state.matrixScenarios.map((scenario) => scenario.id === action.scenarioId ? structuredClone(original) : scenario) };
    }
    case "LOCK_MATRIX": {
      const target = state.matrixScenarios.find((scenario) => scenario.id === action.scenarioId)!;
      const locked = lockMatrix(target, state.brief);
      return { ...state, matrixScenarios: state.matrixScenarios.map((scenario) => scenario.id === locked.id ? locked : scenario), activity: [...state.activity, activity(`${locked.name} Matrix v${locked.version} locked`)] };
    }
    case "GENERATE_PACKAGES": {
      const target = state.matrixScenarios.find((scenario) => scenario.id === action.scenarioId)!;
      const packages = generateSearchPackages(target);
      return { ...state, searchPackages: packages, activity: [...state.activity, activity(`${packages.length} search packages generated`)] };
    }
    case "LOAD_BATCHES": return {
      ...state,
      candidatesLoaded: true,
      batches: state.batches.map((batch) => ({ ...batch, packageIds: state.searchPackages.map((item) => item.id) })),
      activity: [...state.activity, activity("2 candidate batches loaded · 42 profiles evaluated")],
    };
  }
}
