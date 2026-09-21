import type { Dispatch } from "react";
import type { CampaignAction } from "../app/campaignReducer";
import type { RecommendedAction } from "./recommendedAction";

export interface RecommendedActionControls {
  dispatch: Dispatch<CampaignAction>;
  openArtifact: (artifactId: string) => void;
  navigate: (to: string) => void;
}

export function executeRecommendedAction(action: RecommendedAction, controls: RecommendedActionControls) {
  if (action.command.kind === "dispatch") {
    controls.dispatch(action.command.action);
    return;
  }
  if (action.command.kind === "open") {
    controls.openArtifact(action.command.artifactId);
    return;
  }
  if (action.command.kind === "navigate") {
    controls.navigate(action.command.to);
    return;
  }
  document.getElementById(action.command.targetId)?.scrollIntoView({ behavior: "smooth", block: "center" });
}
