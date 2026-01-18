import type { SlotManagerState, CoreSlot } from "./types";

export function initSlotManager(maxSlots = 5): SlotManagerState {
  return { maxSlots, active: [] };
}

export function getOpenSlots(state: SlotManagerState): number {
  return state.maxSlots - state.active.length;
}

export function addSlot(state: SlotManagerState, slot: CoreSlot): SlotManagerState {
  if (state.active.length >= state.maxSlots) return state;
  return { ...state, active: [...state.active, slot] };
}
