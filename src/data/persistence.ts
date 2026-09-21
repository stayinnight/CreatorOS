import type { CampaignState } from "../domain/model";
import { parseCampaignSeed } from "./seedSchema";

const STORAGE_KEY = "creator-mix-planner:v1";

export function loadState(): CampaignState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseCampaignSeed(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveState(state: CampaignState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}
