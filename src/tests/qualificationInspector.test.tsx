import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { campaignSeed } from "../data/seed";
import { generateSearchPackages } from "../domain/search";
import { qualifyCandidateDetailed } from "../domain/qualification";
import { QualificationInspector } from "../components/agent/QualificationInspector";
import { CalibrationActions } from "../components/agent/CalibrationActions";

const packages = generateSearchPackages({ ...campaignSeed.matrixScenarios[0], status: "Locked", version: 1 });

describe("qualification inspector", () => {
  it("shows six gates and hides score for a disqualified candidate", () => {
    const candidate = campaignSeed.candidates.find((item) => item.id === "creator-moto-only")!;
    const searchPackage = packages.find((item) => item.matrixCellId === candidate.matrixCellId)!;
    const html = renderToString(<QualificationInspector candidate={candidate} searchPackage={searchPackage} result={qualifyCandidateDetailed(candidate, searchPackage)} onAsk={() => undefined} />);
    expect(html).toContain("真实自行车骑行");
    expect(html).toContain("Disqualified");
    expect(html).not.toContain("FIT / 100");
  });

  it("disables expansion until calibration is ready", () => {
    const html = renderToString(<CalibrationActions candidateId="creator-01" readiness={{ ready: false, reviewed: 1, acceptedQualified: 1, reviewedFailure: false, preferenceConfirmed: false, blockers: ["至少审阅 3 人"] }} onReview={() => undefined} onPreviewReject={() => undefined} onConfirmNoAdjustment={() => undefined} onApprove={() => undefined} />);
    expect(html).toContain("至少审阅 3 人");
    expect(html).toContain("disabled");
  });
});
