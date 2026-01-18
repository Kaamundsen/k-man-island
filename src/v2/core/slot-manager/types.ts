export type CoreSlot = {
  tradeId: string;
  symbol: string;
  openedAt: string; // YYYY-MM-DD
};

export type SlotManagerState = {
  maxSlots: number; // 3–5
  active: CoreSlot[];
};
