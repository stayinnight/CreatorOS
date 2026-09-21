import type { CampaignState } from "../domain/model";
import { parseCampaignSeed } from "./seedSchema";

const STORAGE_KEY = "creator-mix-planner:v2";

export function loadState(): CampaignState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseCampaignSeed(JSON.parse(raw)) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveState(state: CampaignState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("creator-mix-planner:v1");
}
