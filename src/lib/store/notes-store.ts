/**
 * Notes & Alerts Store
 * 
 * Lagrer notater og varsler per aksje i localStorage.
 */

export interface StockNote {
  id: string;
  ticker: string;
  note: string;
  createdAt: string;
  reminder?: string;         // ISO date for påminnelse
  alertEnabled: boolean;
  tags: string[];            // "sesong", "rapport", "mønster", "personlig"
}

export interface StockAlert {
  id: string;
  ticker: string;
  type: 'price_above' | 'price_below' | 'volume_spike' | 'pattern' | 'reminder';
  value?: number;
  message: string;
  enabled: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

const NOTES_KEY = 'kman_stock_notes';
const ALERTS_KEY = 'kman_stock_alerts';

// --- NOTES ---

export function getNotes(ticker?: string): StockNote[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(NOTES_KEY);
  const notes: StockNote[] = stored ? JSON.parse(stored) : [];
  
  if (ticker) {
    return notes.filter(n => n.ticker === ticker);
  }
  return notes;
}

export function addNote(note: Omit<StockNote, 'id' | 'createdAt'>): StockNote {
  const notes = getNotes();
  
  const newNote: StockNote = {
    ...note,
    id: `note-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  
  notes.push(newNote);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  
  return newNote;
}

export function updateNote(id: string, updates: Partial<StockNote>): StockNote | null {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === id);
  
  if (index === -1) return null;
  
  notes[index] = { ...notes[index], ...updates };
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  
  return notes[index];
}

export function deleteNote(id: string): boolean {
  const notes = getNotes();
  const filtered = notes.filter(n => n.id !== id);
  
  if (filtered.length === notes.length) return false;
  
  localStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
  return true;
}

// --- ALERTS ---

export function getAlerts(ticker?: string): StockAlert[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(ALERTS_KEY);
  const alerts: StockAlert[] = stored ? JSON.parse(stored) : [];
  
  if (ticker) {
    return alerts.filter(a => a.ticker === ticker);
  }
  return alerts;
}

export function getActiveAlerts(): StockAlert[] {
  return getAlerts().filter(a => a.enabled && !a.triggered);
}

export function getTriggeredAlerts(): StockAlert[] {
  return getAlerts().filter(a => a.triggered);
}

export function addAlert(alert: Omit<StockAlert, 'id' | 'createdAt' | 'triggered'>): StockAlert {
  const alerts = getAlerts();
  
  const newAlert: StockAlert = {
    ...alert,
    id: `alert-${Date.now()}`,
    createdAt: new Date().toISOString(),
    triggered: false,
  };
  
  alerts.push(newAlert);
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  
  return newAlert;
}

export function triggerAlert(id: string): StockAlert | null {
  const alerts = getAlerts();
  const index = alerts.findIndex(a => a.id === id);
  
  if (index === -1) return null;
  
  alerts[index].triggered = true;
  alerts[index].triggeredAt = new Date().toISOString();
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  
  return alerts[index];
}

export function deleteAlert(id: string): boolean {
  const alerts = getAlerts();
  const filtered = alerts.filter(a => a.id !== id);
  
  if (filtered.length === alerts.length) return false;
  
  localStorage.setItem(ALERTS_KEY, JSON.stringify(filtered));
  return true;
}

export function clearTriggeredAlerts(): void {
  const alerts = getAlerts().filter(a => !a.triggered);
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

// --- CHECK ALERTS ---

export function checkPriceAlerts(ticker: string, currentPrice: number): StockAlert[] {
  const alerts = getAlerts(ticker).filter(a => a.enabled && !a.triggered);
  const triggered: StockAlert[] = [];
  
  alerts.forEach(alert => {
    if (alert.type === 'price_above' && alert.value && currentPrice >= alert.value) {
      triggerAlert(alert.id);
      triggered.push(alert);
    } else if (alert.type === 'price_below' && alert.value && currentPrice <= alert.value) {
      triggerAlert(alert.id);
      triggered.push(alert);
    }
  });
  
  return triggered;
}

// --- REMINDER CHECK ---

export function checkReminders(): StockNote[] {
  const notes = getNotes().filter(n => n.alertEnabled && n.reminder);
  const today = new Date().toISOString().split('T')[0];
  
  return notes.filter(n => {
    if (!n.reminder) return false;
    const reminderDate = n.reminder.split('T')[0];
    return reminderDate <= today;
  });
}
