export type CoreAction = "ENTER" | "HOLD" | "MOVE_STOP" | "EXIT";

export type CoreDecision = {
  symbol: string;
  action: CoreAction;
  priority: "HIGH" | "MED" | "LOW";
  reasons: string[];
  params?: Record<string, unknown>;
};
