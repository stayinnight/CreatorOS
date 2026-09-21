import type { Locale } from "./messages";

export type EntityType = "briefSource" | "briefConflict" | "matrixScenario" | "matrixRow" | "searchPackage" | "batch" | "candidate" | "artifact" | "decision";

const zhEntityCopy: Record<string, string> = {
  "briefSource.source-email.title": "客户启动邮件",
  "matrixScenario.scenario-balanced.strategy": "在覆盖、预算和长视频深度之间取得平衡",
  "candidate.candidate-riley.internalNote": "真实公路骑行与稳定的第一视角证据",
};

export function localizedEntityField(locale: Locale, type: EntityType, id: string, field: string, fallback: string) {
  if (locale === "en") return fallback;
  return zhEntityCopy[`${type}.${id}.${field}`] ?? fallback;
}
