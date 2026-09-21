export function StatusBadge({ status }: { status: string }) {
  const tone = ["Locked", "Published", "Ready", "Enough", "Qualified", "Select", "Success"].includes(status) ? "pass"
    : ["Draft", "Needs Review", "Maybe", "Info"].includes(status) ? "neutral" : "fail";
  return <span className={`status-badge ${tone}`}>{status}</span>;
}
