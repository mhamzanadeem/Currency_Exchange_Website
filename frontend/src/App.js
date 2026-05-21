import React, { useState, useCallback } from 'react';
import './App.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const POPULAR_CURRENCIES = [
  'USD','EUR','GBP','JPY','CAD','AUD','CHF','CNY','INR','MXN',
  'BRL','SGD','HKD','NOK','SEK','DKK','NZD','ZAR','KRW','AED',
  'SAR','THB','MYR','IDR','PHP','PKR','TRY','RUB','PLN','CZK',
];

const API_BASE = process.env.REACT_APP_API_URL || '/api';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ExpenseRow({ item, index, onChange, onRemove, isOnly }) {
  return (
    <div className="expense-row">
      <input
        className="expense-name"
        type="text"
        placeholder="e.g. Hotel"
        value={item.name}
        onChange={e => onChange(index, 'name', e.target.value)}
        maxLength={60}
      />
      <input
        className="expense-amount"
        type="number"
        placeholder="0.00"
        value={item.amount}
        min="0.01"
        step="0.01"
        onChange={e => onChange(index, 'amount', e.target.value)}
      />
      <button
        className="btn-remove"
        onClick={() => onRemove(index)}
        disabled={isOnly}
        title={isOnly ? 'Need at least one item' : 'Remove item'}
      >
        ✕
      </button>
    </div>
  );
}

function CurrencyPill({ code, selected, onToggle, disabled }) {
  return (
    <button
      className={`currency-pill ${selected ? 'selected' : ''} ${disabled && !selected ? 'disabled' : ''}`}
      onClick={() => onToggle(code)}
      disabled={disabled && !selected}
      title={disabled && !selected ? 'Maximum 5 currencies selected' : code}
    >
      {code}
    </button>
  );
}

function ResultCard({ result, baseCurrency, buffer }) {
  const savings = result.total_with_buffer - result.total_converted;
  return (
    <div className={`result-card ${result.is_fallback ? 'fallback' : ''}`}>
      <div className="result-header">
        <span className="result-currency">{result.currency}</span>
        {result.is_fallback && <span className="fallback-badge">CACHED</span>}
      </div>
      <div className="result-amount">{formatAmount(result.total_with_buffer, result.currency)}</div>
      <div className="result-breakdown">
        <div className="breakdown-row">
          <span>Base total ({baseCurrency})</span>
          <span>{formatAmount(result.total_base, baseCurrency)}</span>
        </div>
        <div className="breakdown-row">
          <span>Converted</span>
          <span>{formatAmount(result.total_converted, result.currency)}</span>
        </div>
        {buffer > 0 && (
          <div className="breakdown-row buffer">
            <span>Safety buffer (+{buffer}%)</span>
            <span>+{formatAmount(savings, result.currency)}</span>
          </div>
        )}
        <div className="breakdown-row rate">
          <span>Rate: 1 {baseCurrency}</span>
          <span>= {result.exchange_rate.toFixed(4)} {result.currency}</span>
        </div>
      </div>
    </div>
  );
}

function formatAmount(amount, currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function App() {
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [items, setItems] = useState([{ name: '', amount: '' }]);
  const [targetCurrencies, setTargetCurrencies] = useState(['EUR', 'JPY', 'GBP']);
  const [buffer, setBuffer] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  // ── Item management ──────────────────────────────────────────────────────
  const addItem = () => setItems(prev => [...prev, { name: '', amount: '' }]);

  const removeItem = (index) =>
    setItems(prev => prev.filter((_, i) => i !== index));

  const updateItem = (index, field, value) =>
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));

  const toggleCurrency = useCallback((code) => {
    setTargetCurrencies(prev => {
      if (prev.includes(code)) return prev.filter(c => c !== code);
      if (prev.length >= 5) return prev;
      return [...prev, code];
    });
  }, []);

  // ── Form submission ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);
    setWarning(null);
    setResults(null);

    // Client-side sanity check before sending
    const validItems = items.filter(i => i.name.trim() && parseFloat(i.amount) > 0);
    if (validItems.length === 0) {
      setError('Please add at least one expense with a name and a positive amount.');
      return;
    }

    // Backend requires exactly 5 target currencies
    if (targetCurrencies.length !== 5) {
      setError('Please select exactly 5 target currencies.');
      return;
    }

    const payload = {
      base_currency: baseCurrency,
      expenses: validItems.map(i => parseFloat(i.amount)),
      target_currencies: targetCurrencies,
      buffer_percentage: parseFloat(buffer) || 0,
    };

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'An error occurred. Please check your inputs.');
        return;
      }

      // Backend returns a simple shape. Transform it into the UI's expected structure.
      const transformed = {
        source: 'live',
        base_currency: data.base_currency,
        items_total_base: data.total,
        safety_buffer_pct: data.buffer_percentage,
        total_with_buffer: data.total_with_buffer,
        results: Object.entries(data.converted_totals || {}).map(([currency, amount_with_buffer]) => {
          const totalBase = Number(data.total) || 0;
          const totalWithBufferBase = Number(data.total_with_buffer) || 0;
          const amtWithBuffer = Number(amount_with_buffer) || 0;
          const rate = totalWithBufferBase ? (amtWithBuffer / totalWithBufferBase) : 0;
          const convertedNoBuffer = rate * totalBase;

          return {
            currency,
            exchange_rate: rate,
            total_converted: convertedNoBuffer,
            total_base: totalBase,
            total_with_buffer: amtWithBuffer,
            is_fallback: false,
          };
        }),
      };

      setResults(transformed);
      if (data.warning) setWarning(data.warning);
    } catch (err) {
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalBase = items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

  return (
    <div className="app">
      {/* ── Background decoration ── */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-grid" />

      {/* ── Header ── */}
      <header className="site-header">
        <div className="header-eyebrow">✈ Travel Finance Tool</div>
        <h1 className="site-title">
          Global Vacation<br /><em>Budget Simulator</em>
        </h1>
        <p className="site-subtitle">
          Price your trip in any currency — instantly, with a safety buffer built in.
        </p>
      </header>

      <main className="main-layout">
        {/* ── Left panel: inputs ── */}
        <section className="panel panel-input">

          {/* Base currency (fixed to USD) */}
          <div className="field-group">
            <label className="field-label">Base Currency</label>
            <div className="select-base" aria-readonly="true">USD</div>
          </div>

          {/* Expense items */}
          <div className="field-group">
            <label className="field-label">
              Expense Items
              <span className="field-hint">name + amount in {baseCurrency}</span>
            </label>
            <div className="expense-list">
              {items.map((item, i) => (
                <ExpenseRow
                  key={i}
                  item={item}
                  index={i}
                  onChange={updateItem}
                  onRemove={removeItem}
                  isOnly={items.length === 1}
                />
              ))}
            </div>
            <button className="btn-add" onClick={addItem}>+ Add item</button>
            {totalBase > 0 && (
              <div className="running-total">
                Total: <strong>{formatAmount(totalBase, baseCurrency)}</strong>
              </div>
            )}
          </div>

          {/* Target currencies */}
          <div className="field-group">
            <label className="field-label">
              Target Currencies
              <span className="field-hint">{targetCurrencies.length}/5 selected</span>
            </label>
            <div className="currency-grid">
              {POPULAR_CURRENCIES.map(code => (
                <CurrencyPill
                  key={code}
                  code={code}
                  selected={targetCurrencies.includes(code)}
                  onToggle={toggleCurrency}
                  disabled={targetCurrencies.length >= 5}
                />
              ))}
            </div>
          </div>

          {/* Safety buffer */}
          <div className="field-group">
            <label className="field-label">
              Safety Buffer
              <span className="field-hint">{buffer}% cushion added to totals</span>
            </label>
            <div className="slider-row">
              <input
                type="range" min="0" max="50" step="1"
                value={buffer}
                onChange={e => setBuffer(Number(e.target.value))}
                className="slider"
              />
              <input
                type="number" min="0" max="100" step="1"
                value={buffer}
                onChange={e => setBuffer(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="buffer-input"
              />
              <span className="buffer-pct">%</span>
            </div>
          </div>

          {/* CTA */}
          <button
            className={`btn-convert ${loading ? 'loading' : ''}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" /> Fetching Rates…</>
            ) : (
              '⚡ Convert Budget'
            )}
          </button>
        </section>

        {/* ── Right panel: results ── */}
        <section className="panel panel-results">
          {!results && !error && !loading && (
            <div className="empty-state">
              <div className="empty-icon">🗺</div>
              <p>Fill in your expenses and target currencies,<br />then hit <strong>Convert Budget</strong>.</p>
            </div>
          )}

          {loading && (
            <div className="empty-state">
              <div className="pulse-ring" />
              <p>Fetching live exchange rates…</p>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <strong>⚠ Error</strong>
              <p>{error}</p>
            </div>
          )}

          {warning && (
            <div className="alert alert-warning">
              <strong>ℹ Notice</strong>
              <p>{warning}</p>
            </div>
          )}

          {results && (
            <>
              <div className="results-meta">
                <span className="meta-label meta-label--source">Source</span>
                <span className={`meta-badge ${results.source}`}>{results.source === 'live' ? '🟢 app.exchangerate-api.com' : '🟡 Cached rates'}</span>
                <span className="meta-label">Base total</span>
                <span className="meta-value">{formatAmount(results.items_total_base, results.base_currency)}</span>
              </div>

              <div className="results-grid">
                {results.results.map(r => (
                  <ResultCard
                    key={r.currency}
                    result={r}
                    baseCurrency={results.base_currency}
                    buffer={results.safety_buffer_pct}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <p>Rates via ExchangeRate-API &middot; Fallback to cached rates on timeout &middot; Not financial advice</p>
      </footer>
    </div>
  );
}