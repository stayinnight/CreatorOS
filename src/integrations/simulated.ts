import type { ActivityItem } from "../domain/model";

export function simulateFeishuNotification(kind: string, succeed = true, at = "2026-09-21T12:00:00+08:00"): ActivityItem {
  return { id: `sim-feishu-${kind.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`, at, kind: "Feishu (Simulated)", message: kind, status: succeed ? "Success" : "Failed" };
}

export function simulateGmailReference(threadId: string, at = "2026-09-21T12:02:00+08:00"): ActivityItem {
  return { id: `sim-gmail-${threadId}`, at, kind: "Gmail (Simulated)", message: `Quote provenance linked to ${threadId}`, status: "Success" };
}
