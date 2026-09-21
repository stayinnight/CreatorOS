import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { campaignSeed } from "../data/seed";
import type { CampaignState } from "../domain/model";
import { campaignReducer, type CampaignAction } from "./campaignReducer";

interface CampaignContextValue { state: CampaignState; dispatch: Dispatch<CampaignAction> }
const CampaignContext = createContext<CampaignContextValue | null>(null);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(campaignReducer, campaignSeed, structuredClone);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) throw new Error("useCampaign must be used inside CampaignProvider");
  return context;
}
