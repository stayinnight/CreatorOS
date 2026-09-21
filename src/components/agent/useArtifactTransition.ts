import { useCallback, useEffect, useRef, useState, type Dispatch } from "react";
import type { CampaignAction } from "../../app/campaignReducer";

export type ArtifactTransitionPhase = "idle" | "opening" | "ready" | "closing";

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function useArtifactTransition(selectedArtifactId: string | null, dispatch: Dispatch<CampaignAction>) {
  const [openingArtifactId, setOpeningArtifactId] = useState<string | null>(null);
  const [phase, setPhase] = useState<ArtifactTransitionPhase>(selectedArtifactId ? "ready" : "idle");
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const openArtifact = useCallback((artifactId: string) => {
    if (pendingRef.current || artifactId === selectedArtifactId) return;
    pendingRef.current = artifactId;
    setOpeningArtifactId(artifactId);
    setPhase("opening");
    const finish = () => {
      dispatch({ type: "OPEN_ARTIFACT", artifactId });
      pendingRef.current = null;
      timerRef.current = null;
      setOpeningArtifactId(null);
      setPhase("ready");
    };
    if (prefersReducedMotion()) finish();
    else timerRef.current = window.setTimeout(finish, 260);
  }, [dispatch, selectedArtifactId]);

  const closeArtifact = useCallback(() => {
    clearTimer();
    pendingRef.current = null;
    setOpeningArtifactId(null);
    const finish = () => {
      dispatch({ type: "CLOSE_ARTIFACT" });
      timerRef.current = null;
      setPhase("idle");
    };
    if (prefersReducedMotion() || !selectedArtifactId) finish();
    else {
      setPhase("closing");
      timerRef.current = window.setTimeout(finish, 180);
    }
  }, [clearTimer, dispatch, selectedArtifactId]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return { openArtifact, closeArtifact, openingArtifactId, phase };
}
