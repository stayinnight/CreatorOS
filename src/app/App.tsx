import { NavLink, Route, Routes } from "react-router-dom";
import { resetState } from "../data/persistence";
import { CampaignDeskPage } from "../pages/CampaignDeskPage";
import { InboxPage } from "../pages/InboxPage";
import { RunsPage } from "../pages/RunsPage";
import { ClientPreviewPage } from "../pages/ClientPreviewPage";
import { CampaignProvider, useCampaign } from "./CampaignProvider";

const navigation = [{ label: "Inbox", path: "/" }, { label: "Campaigns", path: "/campaigns/campaign-cycling-camera" }, { label: "Runs", path: "/runs" }];

function Workspace() {
  const { dispatch } = useCampaign();
  return <div className="agent-shell">
    <aside className="global-rail">
      <div className="wordmark"><span className="mark">GS</span><div><strong>Campaign OS</strong><small>Agent workspace</small></div></div>
      <nav aria-label="Work navigation">{navigation.map((item, index) => <NavLink key={item.path} to={item.path} end={item.path === "/"}><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</NavLink>)}</nav>
      <button type="button" className="reset-link" onClick={() => { if (window.confirm("Reset the complete Agent demo?")) { resetState(); dispatch({ type: "RESET" }); } }}>↺ Reset demo</button>
      <div className="sidebar-note"><span className="pulse" /><div><strong>Deterministic Agent</strong><small>No online model</small></div></div>
    </aside>
    <main className="agent-workspace"><Routes><Route path="/" element={<InboxPage />} /><Route path="/campaigns/:campaignId" element={<CampaignDeskPage />} /><Route path="/campaigns/:campaignId/runs/:runId" element={<CampaignDeskPage />} /><Route path="/campaigns/:campaignId/client-preview" element={<ClientPreviewPage />} /><Route path="/runs" element={<RunsPage />} /></Routes></main>
  </div>;
}

export function App() { return <CampaignProvider><Workspace /></CampaignProvider>; }
