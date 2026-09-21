import { NavLink, Route, Routes } from "react-router-dom";
import { resetState } from "../data/persistence";
import { CampaignDeskPage } from "../pages/CampaignDeskPage";
import { InboxPage } from "../pages/InboxPage";
import { RunsPage } from "../pages/RunsPage";
import { ClientPreviewPage } from "../pages/ClientPreviewPage";
import { CampaignProvider, useCampaign } from "./CampaignProvider";
import { LanguageProvider, useLanguage } from "../i18n/LanguageProvider";
import { LanguageToggle } from "../components/LanguageToggle";

function Workspace() {
  const { dispatch } = useCampaign();
  const { t } = useLanguage();
  const navigation = [{ label: t("nav.inbox"), path: "/" }, { label: t("nav.campaigns"), path: "/campaigns/campaign-cycling-camera" }, { label: t("nav.runs"), path: "/runs" }];
  return <div className="agent-shell monochrome-editorial">
    <aside className="global-rail">
      <div className="wordmark"><span className="mark">GS</span><div><strong>Campaign OS</strong><small>{t("shell.agentWorkspace")}</small></div></div>
      <LanguageToggle />
      <nav aria-label={t("shell.navigation")}>{navigation.map((item, index) => <NavLink key={item.path} to={item.path} end={item.path === "/"}><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</NavLink>)}</nav>
      <button type="button" className="reset-link" onClick={() => { if (window.confirm(t("shell.resetConfirm"))) { resetState(); dispatch({ type: "RESET" }); } }}>↺ {t("shell.reset")}</button>
      <div className="sidebar-note"><span className="pulse" /><div><strong>{t("shell.deterministic")}</strong><small>{t("shell.noModel")}</small></div></div>
    </aside>
    <main className="agent-workspace"><Routes><Route path="/" element={<InboxPage />} /><Route path="/campaigns/:campaignId" element={<CampaignDeskPage />} /><Route path="/campaigns/:campaignId/runs/:runId" element={<CampaignDeskPage />} /><Route path="/campaigns/:campaignId/client-preview" element={<ClientPreviewPage />} /><Route path="/runs" element={<RunsPage />} /></Routes></main>
  </div>;
}

export function App() { return <LanguageProvider><CampaignProvider><Workspace /></CampaignProvider></LanguageProvider>; }
