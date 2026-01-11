'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddTradeModal({ isOpen, onClose, onSuccess }: AddTradeModalProps) {
  const [formData, setFormData] = useState({
    ticker: '',
    entryPrice: '',
    quantity: '',
    entryDate: new Date().toISOString().split('T')[0],
    stopLoss: '',
    target: '',
    timeHorizonEnd: '',
    portfolioId: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.ticker || !formData.entryPrice || !formData.quantity || !formData.portfolioId) {
        setError('Vennligst fyll ut alle obligatoriske felter');
        setIsSubmitting(false);
        return;
      }

      // Insert trade into Supabase
      const { data, error: supabaseError } = await supabase
        .from('trades')
        .insert([
          {
            ticker: formData.ticker.toUpperCase(),
            entry_price: parseFloat(formData.entryPrice),
            quantity: parseInt(formData.quantity),
            entry_date: formData.entryDate,
            stop_loss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
            target: formData.target ? parseFloat(formData.target) : null,
            time_horizon_end: formData.timeHorizonEnd || null,
            portfolio_id: formData.portfolioId,
            notes: formData.notes || null,
            status: 'ACTIVE',
            dead_money_warning: false,
          },
        ])
        .select();

      if (supabaseError) {
        throw supabaseError;
      }

      // Success - reset form and close modal
      setFormData({
        ticker: '',
        entryPrice: '',
        quantity: '',
        entryDate: new Date().toISOString().split('T')[0],
        stopLoss: '',
        target: '',
        timeHorizonEnd: '',
        portfolioId: '',
        notes: '',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error adding trade:', err);
      setError(err.message || 'Kunne ikke legge til trade. Sjekk at Supabase er konfigurert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-gray-200 p-6 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-slate">Legg til Trade</h2>
            <p className="text-sm text-gray-600 mt-1">Registrer en ny handel for sporing</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-brand-rose/10 border-2 border-brand-rose rounded-xl p-4 text-brand-rose text-sm">
              {error}
            </div>
          )}

          {/* Portfolio Selection */}
          <div>
            <label className="block text-sm font-bold text-brand-slate mb-2">
              Portfolio *
            </label>
            <select
              name="portfolioId"
              value={formData.portfolioId}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
            >
              <option value="">Velg portfolio</option>
              <option value="portfolio-1">K-Momentum Portfolio</option>
              <option value="portfolio-2">Legacy Portfolio</option>
            </select>
          </div>

          {/* Basic Trade Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-brand-slate mb-2">
                Ticker *
              </label>
              <input
                type="text"
                name="ticker"
                value={formData.ticker}
                onChange={handleChange}
                placeholder="OKEA.OL"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-slate mb-2">
                Antall Aksjer *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="100"
                required
                min="1"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-brand-slate mb-2">
                Inngangspris (NOK) *
              </label>
              <input
                type="number"
                name="entryPrice"
                value={formData.entryPrice}
                onChange={handleChange}
                placeholder="32.50"
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-slate mb-2">
                Inngangsdato *
              </label>
              <input
                type="date"
                name="entryDate"
                value={formData.entryDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Execution Tracking */}
          <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
            <h3 className="text-sm font-bold text-brand-slate mb-4 flex items-center gap-2">
              <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
              Execution Tracking
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-brand-slate mb-2">
                  Stop Loss (NOK)
                </label>
                <input
                  type="number"
                  name="stopLoss"
                  value={formData.stopLoss}
                  onChange={handleChange}
                  placeholder="29.50"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/20 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Automatisk exit hvis pris faller under</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-slate mb-2">
                  Target (NOK)
                </label>
                <input
                  type="number"
                  name="target"
                  value={formData.target}
                  onChange={handleChange}
                  placeholder="39.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Forventet profitt-nivå</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-brand-slate mb-2">
                Tidshorisont (Sluttdato)
              </label>
              <input
                type="date"
                name="timeHorizonEnd"
                value={formData.timeHorizonEnd}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                For Dead Money tracking: System vil varsle hvis pris ikke beveger seg mot target innen denne datoen
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-brand-slate mb-2">
              Notater (valgfritt)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Skriv ned hvorfor du tok denne traden, tekniske observasjoner, etc."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-xl bg-brand-emerald text-white font-bold hover:bg-brand-emerald/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Lagrer...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Legg til Trade
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
