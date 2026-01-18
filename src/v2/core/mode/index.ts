export type CoreRunMode = "READONLY" | "PAPER" | "LIVE";

export type CoreModeConfig = {
  mode: CoreRunMode;
  requireConfirmFirstEnter: boolean;
};

export function defaultCoreMode(): CoreModeConfig {
  return { mode: "READONLY", requireConfirmFirstEnter: true };
}

export function canApplyDecisions(cfg: CoreModeConfig): boolean {
  return cfg.mode === "PAPER" || cfg.mode === "LIVE";
}

export function isLive(cfg: CoreModeConfig): boolean {
  return cfg.mode === "LIVE";
}
