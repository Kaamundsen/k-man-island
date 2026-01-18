import type { CoreDecision } from "@/v2/core/action-engine/types";

export function renderCoreBrief(asOfDate: string, decisions: CoreDecision[]): string {
  const lines: string[] = [];
  lines.push(`# CORE BRIEF — ${asOfDate}`);
  lines.push("");

  const groups: Record<string, CoreDecision[]> = {
    EXIT: [],
    MOVE_STOP: [],
    ENTER: [],
    HOLD: [],
  };

  for (const d of decisions) groups[d.action].push(d);

  const order: Array<keyof typeof groups> = ["EXIT", "MOVE_STOP", "ENTER", "HOLD"];

  for (const key of order) {
    const arr = groups[key];
    if (!arr.length) continue;
    lines.push(`## ${key}`);
    for (const d of arr) {
      const reasons = d.reasons?.length ? ` — ${d.reasons.slice(0, 3).join(", ")}` : "";
      lines.push(`- [${d.action}] ${d.symbol}${reasons}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
