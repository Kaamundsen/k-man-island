'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Trade, TradeInput } from '@/lib/types';
import { createTrade, updateTrade, getPortfolios } from '@/lib/store';
import { StrategyId, STRATEGIES } from '@/lib/strategies';

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editTrade?: Trade | null;
}

export default function AddTradeModal({ isOpen, onClose, onSuccess, editTrade }: AddTradeModalProps) {
  const [formData, setFormData] = useState({
    ticker: '',
    name: '',
    entryPrice: '',
    quantity: '',
    entryDate: new Date().toISOString().split('T')[0],
    stopLoss: '',
    target: '',
    timeHorizonEnd: '',
    portfolioId: '',
    strategyId: '' as StrategyId | '',
    notes: '',
    // Closed trade fields
    exitPrice: '',
    exitDate: '',
    exitReason: '' as 'MANUAL' | 'STOP_LOSS' | 'TARGET' | 'TIME_HORIZON' | '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [portfolios, setPortfolios] = useState<{ id: string; name: string }[]>([]);
  const isEditMode = !!editTrade;
  const isClosedTrade = isEditMode && editTrade?.status !== 'ACTIVE';

  // Load portfolios and set edit data
  useEffect(() => {
    if (isOpen) {
      const loadedPortfolios = getPortfolios();
      setPortfolios(loadedPortfolios.map(p => ({ id: p.id, name: p.name })));
      
      if (editTrade) {
        setFormData({
          ticker: editTrade.ticker,
          name: editTrade.name || '',
          entryPrice: editTrade.entryPrice.toString(),
          quantity: editTrade.quantity.toString(),
          entryDate: new Date(editTrade.entryDate).toISOString().split('T')[0],
          stopLoss: editTrade.stopLoss?.toString() || '',
          target: editTrade.target?.toString() || '',
          timeHorizonEnd: editTrade.timeHorizonEnd ? new Date(editTrade.timeHorizonEnd).toISOString().split('T')[0] : '',
          portfolioId: editTrade.portfolioId,
          strategyId: editTrade.strategyId || '',
          notes: editTrade.notes || '',
          // Closed trade fields
          exitPrice: editTrade.exitPrice?.toString() || '',
          exitDate: editTrade.exitDate ? new Date(editTrade.exitDate).toISOString().split('T')[0] : '',
          exitReason: (editTrade.exitReason || '') as '' | 'MANUAL' | 'STOP_LOSS' | 'TARGET' | 'TIME_HORIZON',
        });
      } else {
        // Reset form for new trade
        setFormData({
          ticker: '',
          name: '',
          entryPrice: '',
          quantity: '',
          entryDate: new Date().toISOString().split('T')[0],
          stopLoss: '',
          target: '',
          timeHorizonEnd: '',
          portfolioId: loadedPortfolios[0]?.id || '',
          strategyId: '',
          notes: '',
          exitPrice: '',
          exitDate: '',
          exitReason: '',
        });
      }
    }
  }, [isOpen, editTrade]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.ticker || !formData.entryPrice || !formData.quantity || !formData.portfolioId || !formData.strategyId) {
        setError('Vennligst fyll ut alle obligatoriske felter (inkludert strategi)');
        setIsSubmitting(false);
        return;
      }

      const entryDate = new Date(formData.entryDate);
      const timeHorizonEnd = formData.timeHorizonEnd 
        ? new Date(formData.timeHorizonEnd) 
        : new Date(entryDate.getTime() + 60 * 24 * 60 * 60 * 1000); // Default 60 days

      if (isEditMode && editTrade) {
        // Update existing trade
        const updatePayload: any = {
          id: editTrade.id,
          ticker: formData.ticker.toUpperCase(),
          name: formData.name || undefined,
          entryPrice: parseFloat(formData.entryPrice),
          quantity: parseInt(formData.quantity),
          entryDate,
          portfolioId: formData.portfolioId,
          strategyId: formData.strategyId as StrategyId,
          stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : undefined,
          target: formData.target ? parseFloat(formData.target) : undefined,
          timeHorizonEnd,
          notes: formData.notes || undefined,
        };
        
        // Add closed trade fields if editing a closed trade
        if (isClosedTrade) {
          if (formData.exitPrice) {
            updatePayload.exitPrice = parseFloat(formData.exitPrice);
          }
          if (formData.exitDate) {
            updatePayload.exitDate = new Date(formData.exitDate);
          }
          if (formData.exitReason) {
            updatePayload.exitReason = formData.exitReason;
          }
        }
        
        updateTrade(updatePayload);
      } else {
        // Create new trade using local store
        const tradeInput: TradeInput = {
          ticker: formData.ticker.toUpperCase(),
          name: formData.name || undefined,
          entryPrice: parseFloat(formData.entryPrice),
          quantity: parseInt(formData.quantity),
          entryDate,
          portfolioId: formData.portfolioId,
          strategyId: formData.strategyId as StrategyId,
          stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : parseFloat(formData.entryPrice) * 0.9,
          target: formData.target ? parseFloat(formData.target) : parseFloat(formData.entryPrice) * 1.15,
          timeHorizonEnd,
          notes: formData.notes || undefined,
        };

        createTrade(tradeInput);
      }

      // Success - reset form and close modal
      setFormData({
        ticker: '',
        name: '',
        entryPrice: '',
        quantity: '',
        entryDate: new Date().toISOString().split('T')[0],
        stopLoss: '',
        target: '',
        timeHorizonEnd: '',
        portfolioId: portfolios[0]?.id || '',
        strategyId: '',
        notes: '',
        exitPrice: '',
        exitDate: '',
        exitReason: '',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Error saving trade:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre trade.');
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
      <div className="bg-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              {isEditMode 
                ? isClosedTrade 
                  ? <><Edit className="w-6 h-6" /> Rediger Lukket Trade</>
                  : <><Edit className="w-6 h-6" /> Rediger Trade</>
                : 'Legg til Trade'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isEditMode 
                ? isClosedTrade 
                  ? `Oppdater salgspris, dato eller notat for ${editTrade?.ticker}`
                  : `Oppdater ${editTrade?.ticker}`
                : 'Registrer en ny handel for sporing'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-brand-rose/10 border-2 border-brand-rose rounded-xl p-4 text-brand-rose text-sm">
              {error}
            </div>
          )}

          {/* Portfolio and Strategy Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Portfolio *
              </label>
              <select
                name="portfolioId"
                value={formData.portfolioId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
              >
                <option value="">Velg portfolio</option>
                {portfolios.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Strategi *
              </label>
              <select
                name="strategyId"
                value={formData.strategyId}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
              >
                <option value="">Velg strategi</option>
                {Object.entries(STRATEGIES).map(([id, strategy]) => (
                  <option key={id} value={id}>{strategy.emoji} {strategy.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Basic Trade Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Ticker *
              </label>
              <input
                type="text"
                name="ticker"
                value={formData.ticker}
                onChange={handleChange}
                placeholder="OKEA.OL"
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
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
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
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
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Inngangsdato *
              </label>
              <input
                type="date"
                name="entryDate"
                value={formData.entryDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Execution Tracking */}
          <div className="bg-blue-500/10 dark:bg-blue-950/40 rounded-2xl p-4 border-2 border-blue-500/30">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
              Execution Tracking
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
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
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/20 outline-none transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1">Automatisk exit hvis pris faller under</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
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
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1">Forventet profitt-nivå</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-foreground mb-2">
                Tidshorisont (Sluttdato)
              </label>
              <input
                type="date"
                name="timeHorizonEnd"
                value={formData.timeHorizonEnd}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
              />
              <p className="text-xs text-muted-foreground mt-1">
                For Dead Money tracking: System vil varsle hvis pris ikke beveger seg mot target innen denne datoen
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Notater (valgfritt)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Skriv ned hvorfor du tok denne traden, tekniske observasjoner, etc."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Closed Trade Fields - Only shown when editing a closed trade */}
          {isClosedTrade && (
            <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 space-y-4">
              <h3 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                📦 Salgsdata (Lukket Trade)
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-amber-600 dark:text-amber-400 mb-2">
                    Salgspris (NOK)
                  </label>
                  <input
                    type="number"
                    name="exitPrice"
                    value={formData.exitPrice}
                    onChange={handleChange}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-amber-500/30 bg-card text-foreground placeholder:text-muted-foreground focus:border-amber-400 focus:ring-2 focus:ring-amber-200/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-amber-600 dark:text-amber-400 mb-2">
                    Salgsdato
                  </label>
                  <input
                    type="date"
                    name="exitDate"
                    value={formData.exitDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-amber-500/30 bg-card text-foreground focus:border-amber-400 focus:ring-2 focus:ring-amber-200/20 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-amber-600 dark:text-amber-400 mb-2">
                  Årsak til salg
                </label>
                <select
                  name="exitReason"
                  value={formData.exitReason}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-amber-500/30 bg-card text-foreground focus:border-amber-400 focus:ring-2 focus:ring-amber-200/20 outline-none transition-all"
                >
                  <option value="">Velg årsak</option>
                  <option value="MANUAL">Manuelt salg</option>
                  <option value="STOP_LOSS">Stop loss</option>
                  <option value="TARGET">Nådde mål</option>
                  <option value="TIME_HORIZON">Tidshorisont utløpt</option>
                </select>
              </div>
              
              {/* P/L Preview for closed trade */}
              {formData.exitPrice && formData.entryPrice && (
                <div className="bg-card rounded-lg p-3 border border-amber-500/30">
                  <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">Resultat</div>
                  {(() => {
                    const exitPrice = parseFloat(formData.exitPrice);
                    const entryPrice = parseFloat(formData.entryPrice);
                    const quantity = parseInt(formData.quantity) || 0;
                    const pnl = (exitPrice - entryPrice) * quantity;
                    const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
                    const isProfit = pnl >= 0;
                    return (
                      <div className={`text-lg font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                        {isProfit ? '+' : ''}{pnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                        <span className="text-sm ml-2">
                          ({isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-border text-muted-foreground font-bold hover:bg-muted transition-colors"
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
                  {isEditMode ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {isEditMode ? 'Oppdater Trade' : 'Legg til Trade'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
