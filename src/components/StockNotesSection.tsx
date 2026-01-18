'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Bell, BellOff, Calendar, Tag, Edit2, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { 
  StockNote, 
  StockAlert,
  getNotes, 
  addNote, 
  deleteNote,
  updateNote,
  getAlerts,
  addAlert,
  deleteAlert
} from '@/lib/store/notes-store';

interface StockNotesSectionProps {
  ticker: string;
  currentPrice: number;
}

const TAG_OPTIONS = [
  { value: 'sesong', label: 'Sesong', color: 'bg-blue-100 text-blue-700' },
  { value: 'rapport', label: 'Rapport', color: 'bg-purple-100 text-purple-700' },
  { value: 'mønster', label: 'Mønster', color: 'bg-orange-100 text-orange-700' },
  { value: 'personlig', label: 'Personlig', color: 'bg-gray-100 text-gray-700' },
];

export default function StockNotesSection({ ticker, currentPrice }: StockNotesSectionProps) {
  const [notes, setNotes] = useState<StockNote[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  
  // Note form state
  const [noteText, setNoteText] = useState('');
  const [noteReminder, setNoteReminder] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [noteAlert, setNoteAlert] = useState(false);
  
  // Alert form state
  const [alertType, setAlertType] = useState<'price_above' | 'price_below'>('price_above');
  const [alertValue, setAlertValue] = useState(currentPrice.toString());
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    setNotes(getNotes(ticker));
    setAlerts(getAlerts(ticker));
  }, [ticker]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    
    const newNote = addNote({
      ticker,
      note: noteText,
      reminder: noteReminder || undefined,
      alertEnabled: noteAlert,
      tags: noteTags,
    });
    
    setNotes([newNote, ...notes]);
    resetNoteForm();
  };

  const handleUpdateNote = (id: string) => {
    const updated = updateNote(id, {
      note: noteText,
      reminder: noteReminder || undefined,
      alertEnabled: noteAlert,
      tags: noteTags,
    });
    
    if (updated) {
      setNotes(notes.map(n => n.id === id ? updated : n));
    }
    resetNoteForm();
  };

  const handleDeleteNote = (id: string) => {
    if (deleteNote(id)) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const handleEditNote = (note: StockNote) => {
    setEditingNoteId(note.id);
    setNoteText(note.note);
    setNoteReminder(note.reminder || '');
    setNoteTags(note.tags);
    setNoteAlert(note.alertEnabled);
    setShowNoteForm(true);
  };

  const resetNoteForm = () => {
    setNoteText('');
    setNoteReminder('');
    setNoteTags([]);
    setNoteAlert(false);
    setShowNoteForm(false);
    setEditingNoteId(null);
  };

  const handleAddAlert = () => {
    const value = parseFloat(alertValue);
    if (isNaN(value)) return;
    
    const newAlert = addAlert({
      ticker,
      type: alertType,
      value,
      message: alertMessage || `Pris ${alertType === 'price_above' ? 'over' : 'under'} ${value} kr`,
      enabled: true,
    });
    
    setAlerts([newAlert, ...alerts]);
    setShowAlertForm(false);
    setAlertMessage('');
  };

  const handleDeleteAlert = (id: string) => {
    if (deleteAlert(id)) {
      setAlerts(alerts.filter(a => a.id !== id));
    }
  };

  const toggleTag = (tag: string) => {
    setNoteTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-6">
      {/* Notes Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900">📝 Mine notater</h3>
          <button
            onClick={() => setShowNoteForm(!showNoteForm)}
            className="flex items-center gap-1 text-sm text-brand-emerald hover:text-brand-emerald/80"
          >
            <Plus className="w-4 h-4" />
            Nytt notat
          </button>
        </div>

        {/* Note Form */}
        {showNoteForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Skriv ditt notat her..."
              className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald resize-none"
              rows={3}
            />
            
            {/* Tags */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map(tag => (
                  <button
                    key={tag.value}
                    onClick={() => toggleTag(tag.value)}
                    className={clsx(
                      'px-3 py-1 rounded-full text-sm font-medium transition-all',
                      noteTags.includes(tag.value) ? tag.color : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Reminder */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={noteReminder}
                  onChange={(e) => setNoteReminder(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noteAlert}
                  onChange={(e) => setNoteAlert(e.target.checked)}
                  className="rounded border-gray-300 text-brand-emerald focus:ring-brand-emerald"
                />
                <Bell className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Varsle meg</span>
              </label>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={resetNoteForm}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Avbryt
              </button>
              <button
                onClick={() => editingNoteId ? handleUpdateNote(editingNoteId) : handleAddNote()}
                className="px-4 py-2 text-sm bg-brand-emerald text-white rounded-lg hover:bg-brand-emerald/90"
              >
                {editingNoteId ? 'Oppdater' : 'Lagre'}
              </button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <p className="text-gray-400 text-center py-6">Ingen notater enda</p>
        ) : (
          <div className="space-y-3">
            {notes.map(note => (
              <div key={note.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map(tag => {
                      const tagConfig = TAG_OPTIONS.find(t => t.value === tag);
                      return (
                        <span key={tag} className={clsx(
                          'text-xs px-2 py-0.5 rounded-full',
                          tagConfig?.color || 'bg-gray-100 text-gray-600'
                        )}>
                          {tagConfig?.label || tag}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    {note.alertEnabled && (
                      <Bell className="w-4 h-4 text-brand-emerald" />
                    )}
                    <button 
                      onClick={() => handleEditNote(note)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700">{note.note}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>{new Date(note.createdAt).toLocaleDateString('nb-NO')}</span>
                  {note.reminder && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Påminnelse: {new Date(note.reminder).toLocaleDateString('nb-NO')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900">🔔 Prisvarsler</h3>
          <button
            onClick={() => setShowAlertForm(!showAlertForm)}
            className="flex items-center gap-1 text-sm text-brand-emerald hover:text-brand-emerald/80"
          >
            <Plus className="w-4 h-4" />
            Nytt varsel
          </button>
        </div>

        {/* Alert Form */}
        {showAlertForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex items-center gap-3">
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as typeof alertType)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="price_above">Pris over</option>
                <option value="price_below">Pris under</option>
              </select>
              
              <div className="relative">
                <input
                  type="number"
                  value={alertValue}
                  onChange={(e) => setAlertValue(e.target.value)}
                  className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  step="0.01"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kr</span>
              </div>
            </div>
            
            <input
              type="text"
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              placeholder="Valgfri melding..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAlertForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Avbryt
              </button>
              <button
                onClick={handleAddAlert}
                className="px-4 py-2 text-sm bg-brand-emerald text-white rounded-lg hover:bg-brand-emerald/90"
              >
                Opprett varsel
              </button>
            </div>
          </div>
        )}

        {/* Current Price Reference */}
        <div className="text-sm text-gray-500 mb-3">
          Nåværende pris: <span className="font-semibold text-gray-700">{currentPrice.toFixed(2)} kr</span>
        </div>

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <p className="text-gray-400 text-center py-6">Ingen varsler satt</p>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                className={clsx(
                  'flex items-center justify-between p-3 rounded-lg border',
                  alert.triggered ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-center gap-3">
                  {alert.triggered ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Bell className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {alert.type === 'price_above' ? 'Over' : 'Under'} {alert.value} kr
                    </p>
                    {alert.message && (
                      <p className="text-xs text-gray-500">{alert.message}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
