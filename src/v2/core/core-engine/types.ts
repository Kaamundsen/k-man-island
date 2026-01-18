export type CoreProfile = "TREND" | "ASYM" | "NONE";

export type CoreEngineOutput = {
  symbol: string;
  profile: CoreProfile;
  hardPass: boolean;
  softScore: number; // 0–100
  reasons: string[];
};
