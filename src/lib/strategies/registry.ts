/**
 * Strategy Registry — stub for backward compatibility
 * TODO: Replace with V2 bucket-based system
 */

export function qualifiesForCore(_score: number): boolean {
  return _score >= 60;
}

export function getMaxCoreSlots(): number {
  return 8;
}
