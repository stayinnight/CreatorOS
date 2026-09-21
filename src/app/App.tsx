import { NavLink, Route, Routes } from "react-router-dom";
import { BriefPage } from "../pages/BriefPage";

const navigation = [
  { label: "Overview", path: "/" },
  { label: "Brief", path: "/brief" },
  { label: "Mix Planner", path: "/mix-planner" },
  { label: "Search & Candidates", path: "/search-candidates" },
  { label: "Client Review", path: "/client-review" },
  { label: "Activity", path: "/activity" },
];

function Placeholder({ title }: { title: string }) {
  return (
    <section className="empty-stage">
      <span className="stage-index">WORKSPACE</span>
      <h2>{title}</h2>
      <p>The campaign workspace is being assembled around the approved cycling-camera brief.</p>
    </section>
  );
}

export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="wordmark">
          <span className="mark">CM</span>
          <div><strong>Creator Mix</strong><small>Planning system</small></div>
        </div>
        <nav aria-label="Campaign workspace">
          {navigation.map((item, index) => (
            <NavLink key={item.path} to={item.path} end={item.path === "/"}>
              <span>{String(index + 1).padStart(2, "0")}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="pulse" />
          <div><strong>Internal workspace</strong><small>All figures in USD</small></div>
        </div>
      </aside>
      <main className="workspace">
        <header className="campaign-header">
          <div>
            <p className="eyebrow">CYCLING CAMERA CAMPAIGN · BRIEF V1</p>
            <h1>Cycling Camera Launch <span>· US / UK</span></h1>
          </div>
          <div className="header-meta">
            <span><small>Deadline</small>8 weeks</span>
            <span><small>Budget</small>$180K</span>
            <button type="button" className="ghost-button">Reset demo</button>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Placeholder title="Overview" />} />
          <Route path="/brief" element={<BriefPage />} />
          <Route path="/mix-planner" element={<Placeholder title="Mix Planner" />} />
          <Route path="/search-candidates" element={<Placeholder title="Search & Candidates" />} />
          <Route path="/client-review" element={<Placeholder title="Client Review" />} />
          <Route path="/activity" element={<Placeholder title="Activity" />} />
        </Routes>
      </main>
    </div>
  );
}
