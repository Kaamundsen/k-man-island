import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime

# ============================================
# 1. KONFIGURASJON
# ============================================
st.set_page_config(
    page_title="K-man Island",
    layout="wide",
    initial_sidebar_state="collapsed"
)

if 'selected_ticker' not in st.session_state:
    st.session_state.selected_ticker = None
if 'view' not in st.session_state:
    st.session_state.view = 'Dashboard'

# ============================================
# 2. DESIGN
# ============================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1a1a1a;
    background-color: #F8F7F4;
}

.stApp { background-color: #F8F7F4; }

section[data-testid="stSidebar"] { display: none; }

/* Venstre navigasjonsmeny */
.left-nav {
    position: fixed;
    left: 0;
    top: 0;
    width: 80px;
    height: 100vh;
    background: #F8F7F4;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 0;
    gap: 8px;
    z-index: 1000;
}

.nav-item {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #9ca3af;
}

.nav-item:hover { background: rgba(255,255,255,0.6); color: #1a1a1a; }
.nav-item.active { background: #ffffff; color: #1a1a1a; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.nav-item svg { width: 24px; height: 24px; stroke: currentColor; stroke-width: 1.5; fill: none; }

[data-testid="stAppViewContainer"] > div:first-child { margin-left: 90px; }

/* Profilkort */
.profile-card {
    background: white;
    border-radius: 24px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    border: 1px solid #e5e7eb;
    margin-bottom: 32px;
}

/* Status-kort */
.status-card {
    border-radius: 24px;
    padding: 28px;
    color: #1a1a1a;
    min-height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s;
}
.status-card:hover { transform: translateY(-4px); }
.card-lime { background: #E2FF3B; }
.card-teal { background: #A3E7D8; }
.card-pink { background: #FFB5B5; }
.status-number { font-size: 3rem; font-weight: 800; line-height: 1; }
.status-label { font-size: 1rem; font-weight: 700; }

/* Aksjekort */
.stock-card {
    background: white;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
    z-index: 1;
    margin-bottom: 20px;
}
.stock-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.08);
}

.stock-header {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    padding: 24px;
    color: white;
}

.stock-badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 800;
    margin-bottom: 12px;
}
.badge-buy { background: #E2FF3B; color: #1a1a1a; }
.badge-hold { background: #A3E7D8; color: #1a1a1a; }
.badge-sell { background: #FFB5B5; color: #1a1a1a; }

.stock-ticker { font-size: 1.6rem; font-weight: 800; margin: 0; }
.stock-subtitle { font-size: 0.85rem; opacity: 0.7; margin-top: 4px; }

.stock-body { padding: 24px; }

.stock-price-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 20px;
}

.price-label {
    font-size: 0.7rem;
    color: #9ca3af;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
}

.price-value { font-size: 1.4rem; font-weight: 800; color: #1a1a1a; }

.stock-metrics { border-top: 1px solid #f3f4f6; padding-top: 20px; }

.metric-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
.metric-item { flex: 1; }
.metric-label { font-size: 0.65rem; color: #9ca3af; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px; }
.metric-value { font-size: 1rem; font-weight: 700; }

.positive { color: #16a34a; }
.negative { color: #dc2626; }

/* Sannsynlighet progress bar */
.prob-container { margin-top: 16px; }
.prob-header { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; margin-bottom: 8px; }
.prob-bar-bg { background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden; }
.prob-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }

.stock-footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #6b7280;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f3f4f6;
}

/* SKJUL KNAPPER I KOLONNER (aksjekort) */
[data-testid="stColumn"] [data-testid="stVerticalBlockBorderWrapper"] {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    height: 500px !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    z-index: 100 !important;
}

[data-testid="stColumn"] [data-testid="stVerticalBlockBorderWrapper"] > div,
[data-testid="stColumn"] [data-testid="stVerticalBlockBorderWrapper"] > div > div {
    height: 100% !important;
    background: transparent !important;
    border: none !important;
}

[data-testid="stColumn"] [data-testid="stVerticalBlockBorderWrapper"] button {
    width: 100% !important;
    height: 100% !important;
    background: transparent !important;
    border: none !important;
    color: transparent !important;
    cursor: pointer !important;
}

[data-testid="stColumn"] > div > div {
    position: relative !important;
}

/* Widget-bokser */
.widget-box {
    background: white;
    border-radius: 20px;
    padding: 24px;
    border: 1px solid #e5e7eb;
    margin-bottom: 16px;
}

.help-card {
    background: linear-gradient(135deg, #2563EB, #1E40AF);
    border-radius: 20px;
    padding: 24px;
    color: white;
}

/* Analyse */
.big-ticker { font-size: 3.5rem; font-weight: 800; letter-spacing: -2px; margin-bottom: 24px; }

.info-box {
    background: white;
    border-radius: 16px;
    padding: 20px;
    border: 1px solid #e5e7eb;
    text-align: center;
}
.info-value { font-size: 1.4rem; font-weight: 800; }
.info-label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; margin-top: 4px; }
</style>
""", unsafe_allow_html=True)

# Venstre navigasjonsmeny
st.markdown("""
<div class="left-nav">
    <div class="nav-item active" title="Hjem">
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div>
    <div class="nav-item" title="Dashboard">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    </div>
    <div class="nav-item" title="Portefølje">
        <svg viewBox="0 0 24 24"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/></svg>
    </div>
    <div class="nav-item" title="Dokumenter">
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    </div>
    <div class="nav-item" title="Profil">
        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>
    <div class="nav-item" title="Innstillinger" style="margin-top: auto;">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </div>
</div>
""", unsafe_allow_html=True)

# ============================================
# 3. DATA MOTOR
# ============================================
watchlist = [
    "NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", 
    "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL", "EQNR.OL", "YAR.OL", "NHY.OL", 
    "MOWI.OL", "SUBC.OL", "TGS.OL", "AKRBP.OL", "ADE.OL", "IDEX.OL", "AUTO.OL", 
    "LSG.OL", "SALM.OL", "BAKK.OL", "TOM.OL", "KOG.OL", "BORR.OL", "OKEA.OL"
]

@st.cache_data(ttl=1800)
def fetch_and_analyze():
    results = []
    for t in watchlist:
        try:
            df = yf.download(t, period="1y", interval="1d", progress=False)
            if df.empty or len(df) < 60: continue
            if isinstance(df.columns, pd.MultiIndex): df.columns = df.columns.droplevel(1)
            
            close = float(df['Close'].iloc[-1])
            prev_close = float(df['Close'].iloc[-2])
            change_pct = ((close - prev_close) / prev_close) * 100
            
            rsi = ta.rsi(df['Close'], length=14).iloc[-1]
            sma20 = ta.sma(df['Close'], length=20).iloc[-1]
            sma50 = ta.sma(df['Close'], length=50).iloc[-1]
            atr = ta.atr(df['High'], df['Low'], df['Close'], length=14).iloc[-1]
            ema12 = ta.ema(df['Close'], length=12).iloc[-1]
            ema26 = ta.ema(df['Close'], length=26).iloc[-1]
            
            if pd.isna(rsi) or pd.isna(sma20) or pd.isna(atr): continue
            
            # Finn target
            recent_highs = df['High'].tail(60).values
            resistance = [recent_highs[i] for i in range(1, len(recent_highs)-1) 
                         if recent_highs[i] > recent_highs[i-1] and recent_highs[i] > recent_highs[i+1]]
            above = [r for r in resistance if r > close]
            target = min(above) if above else close * 1.10
            
            stop_loss = close - (2 * atr)
            pot_kr = target - close
            pot_pct = (pot_kr / close) * 100
            risk_kr = close - stop_loss
            risk_pct = (risk_kr / close) * 100
            
            five_day = (close / float(df['Close'].iloc[-5])) - 1 if len(df) >= 5 else 0
            
            # Signal-logikk
            is_buy = (rsi < 55 and close > sma20 and close > sma50 and ema12 > ema26 and five_day > 0)
            is_sell = rsi > 75 or (close < sma20 and close < sma50)
            signal = "BUY" if is_buy else "SELL" if is_sell else "HOLD"
            
            # Sannsynlighet beregning - basert på ALLE faktorer
            # Teller hvor mange bullish-kriterier som er oppfylt
            bullish_score = 0
            if rsi < 55: bullish_score += 20  # RSI i kjøpssone
            if rsi < 45: bullish_score += 10  # Ekstra bonus for lav RSI
            if close > sma20: bullish_score += 15  # Over SMA20
            if close > sma50: bullish_score += 15  # Over SMA50
            if ema12 > ema26: bullish_score += 15  # Bullish EMA crossover
            if five_day > 0: bullish_score += 10  # Positiv momentum
            if five_day > 0.02: bullish_score += 5  # Sterk momentum (+2%)
            if pot_pct > 5: bullish_score += 10  # God oppside
            
            # BUY-signal gir bonus, SELL gir straff
            if signal == "BUY":
                prob = min(bullish_score + 15, 95)  # Bonus for å møte alle kriterier
            elif signal == "SELL":
                prob = max(bullish_score - 30, 10)  # Straff for salgssignal
            else:
                prob = max(bullish_score - 10, 20)  # Litt lavere for HOLD
            
            results.append({
                "ticker": t, "ticker_short": t.replace('.OL', ''),
                "pris": round(close, 2), "endring": round(change_pct, 2), "rsi": round(rsi, 1),
                "signal": signal, "target": round(target, 2), "stop_loss": round(stop_loss, 2),
                "pot_kr": round(pot_kr, 2), "pot_pct": round(pot_pct, 1),
                "risk_kr": round(risk_kr, 2), "risk_pct": round(risk_pct, 1),
                "prob": prob, "df": df
            })
        except: continue
    
    # Sorter etter sannsynlighet (høyest først), prioriter BUY
    # Sortering: 1) Signal (BUY først), 2) Sannsynlighet (høyest), 3) Gevinstpotensial (høyest)
    return sorted(results, key=lambda x: (
        0 if x['signal'] == 'BUY' else 1 if x['signal'] == 'HOLD' else 2,
        -x['prob'],
        -x['pot_pct']
    ))

# ============================================
# 4. HOVEDINNHOLD
# ============================================
data = fetch_and_analyze()

if not data:
    st.warning("Kunne ikke hente data. Børsen kan være stengt.")
    st.stop()

c_main, c_side = st.columns([3, 1])

with c_main:
    if st.session_state.view == 'Dashboard' and not st.session_state.selected_ticker:
        
        h1, h2 = st.columns([3, 1])
        with h1:
            st.markdown("<h1 style='font-size: 2.2rem; font-weight: 800; margin-bottom: 8px;'>Oversikt</h1>", unsafe_allow_html=True)
        with h2:
            if st.button("🔄 Oppdater", use_container_width=True):
                st.cache_data.clear()
                st.rerun()
        
        # Profilkort
        st.markdown("""
        <div class="profile-card">
            <div style="width:80px;height:80px;border-radius:50%;overflow:hidden;background:#f0f0f0;">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ola" style="width:100%">
            </div>
            <div>
                <h2 style="margin:0;font-weight:800;font-size:1.3rem;">K-man Investor</h2>
                <p style="margin:4px 0 0 0;color:#6b7280;font-size:0.9rem;">Strategisk Porteføljestyring · Oslo Børs</p>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Status-kort
        buys = len([d for d in data if d['signal'] == 'BUY'])
        holds = len([d for d in data if d['signal'] == 'HOLD'])
        sells = len([d for d in data if d['signal'] == 'SELL'])
        
        s1, s2, s3 = st.columns(3)
        with s1:
            st.markdown(f'<div class="status-card card-lime"><div class="status-number">{buys}</div><div class="status-label">Kjøpssignaler</div></div>', unsafe_allow_html=True)
        with s2:
            st.markdown(f'<div class="status-card card-teal"><div class="status-number">{holds}</div><div class="status-label">Hold</div></div>', unsafe_allow_html=True)
        with s3:
            st.markdown(f'<div class="status-card card-pink"><div class="status-number">{sells}</div><div class="status-label">Salgssignaler</div></div>', unsafe_allow_html=True)
        
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("<h2 style='font-size: 1.5rem; font-weight: 800;'>🎯 Dagens Muligheter</h2>", unsafe_allow_html=True)
        st.markdown("<p style='color: #6b7280; margin-bottom: 24px;'>Sortert etter høyest sannsynlighet</p>", unsafe_allow_html=True)
        
        # Aksjekort
        cols = st.columns(2)
        for i, stock in enumerate(data[:6]):
            with cols[i % 2]:
                badge_class = "badge-buy" if stock['signal'] == "BUY" else "badge-sell" if stock['signal'] == "SELL" else "badge-hold"
                badge_text = "KJØP" if stock['signal'] == "BUY" else "SELG" if stock['signal'] == "SELL" else "HOLD"
                prob_color = "#E2FF3B" if stock['prob'] > 70 else "#A3E7D8" if stock['prob'] > 50 else "#FFB5B5"
                
                # Usynlig knapp over kortet
                if st.button("⠀", key=f"btn_{stock['ticker']}", use_container_width=True):
                    st.session_state.selected_ticker = stock['ticker']
                    st.rerun()
                
                st.markdown(f"""
                <div class="stock-card" data-ticker="{stock['ticker']}">
                    <div class="stock-header">
                        <span class="stock-badge {badge_class}">{badge_text}</span>
                        <h3 class="stock-ticker">{stock['ticker_short']}</h3>
                        <div class="stock-subtitle">Oslo Børs · #{i+1}</div>
                    </div>
                    <div class="stock-body">
                        <div class="stock-price-row">
                            <div>
                                <div class="price-label">Pris</div>
                                <div class="price-value">{stock['pris']:.2f} NOK</div>
                            </div>
                            <div style="text-align:right;">
                                <div class="price-label">RSI</div>
                                <div class="price-value">{stock['rsi']:.1f}</div>
                            </div>
                        </div>
                        <div class="stock-metrics">
                            <div class="metric-row">
                                <div class="metric-item">
                                    <div class="metric-label">Gevinstpotensial</div>
                                    <div class="metric-value positive">+{stock['pot_kr']:.2f} kr / +{stock['pot_pct']:.1f}%</div>
                                </div>
                                <div class="metric-item" style="text-align:right;">
                                    <div class="metric-label">Risiko</div>
                                    <div class="metric-value negative">-{stock['risk_kr']:.2f} kr / -{stock['risk_pct']:.1f}%</div>
                                </div>
                            </div>
                        </div>
                        <div class="prob-container">
                            <div class="prob-header">
                                <span>Sannsynlighet</span>
                                <span>{stock['prob']}%</span>
                            </div>
                            <div class="prob-bar-bg">
                                <div class="prob-bar-fill" style="width: {stock['prob']}%; background-color: {prob_color};"></div>
                            </div>
                        </div>
                        <div class="stock-footer">
                            <span>Target: <strong>{stock['target']:.2f}</strong></span>
                            <span>Stop: <strong>{stock['stop_loss']:.2f}</strong></span>
                        </div>
                    </div>
                </div>
                """, unsafe_allow_html=True)

    # Analyse-visning
    elif st.session_state.selected_ticker:
        stock = next((d for d in data if d['ticker'] == st.session_state.selected_ticker), None)
        if not stock:
            st.error("Fant ikke aksjen")
            st.stop()
        
        if st.button("← Tilbake til oversikt"):
            st.session_state.selected_ticker = None
            st.rerun()
        
        st.markdown(f"<h1 class='big-ticker'>{stock['ticker_short']}</h1>", unsafe_allow_html=True)
        
        # Info-kort
        i1, i2, i3, i4, i5 = st.columns(5)
        badge_class = "badge-buy" if stock['signal'] == "BUY" else "badge-sell" if stock['signal'] == "SELL" else "badge-hold"
        badge_text = "KJØP" if stock['signal'] == "BUY" else "SELG" if stock['signal'] == "SELL" else "HOLD"
        
        with i1:
            st.markdown(f'<div class="info-box"><span class="stock-badge {badge_class}">{badge_text}</span><div class="info-label" style="margin-top:8px;">Signal</div></div>', unsafe_allow_html=True)
        with i2:
            st.markdown(f'<div class="info-box"><div class="info-value">{stock["pris"]:.2f}</div><div class="info-label">Pris</div></div>', unsafe_allow_html=True)
        with i3:
            st.markdown(f'<div class="info-box"><div class="info-value positive">+{stock["pot_pct"]:.1f}%</div><div class="info-label">Gevinstpotensial</div></div>', unsafe_allow_html=True)
        with i4:
            st.markdown(f'<div class="info-box"><div class="info-value negative">-{stock["risk_pct"]:.1f}%</div><div class="info-label">Risiko</div></div>', unsafe_allow_html=True)
        with i5:
            st.markdown(f'<div class="info-box"><div class="info-value">{stock["prob"]}%</div><div class="info-label">Sannsynlighet</div></div>', unsafe_allow_html=True)
        
        # Tabs for ulike seksjoner
        tab1, tab2, tab3, tab4 = st.tabs(["📈 Graf & Analyse", "📋 Handelsplan", "👤 Innsidehandel", "📰 Nyheter"])
        
        with tab1:
            # Graf
            df_p = stock['df'].tail(90)
            fig = go.Figure(data=[go.Candlestick(
                x=df_p.index, open=df_p['Open'], high=df_p['High'], low=df_p['Low'], close=df_p['Close'],
                increasing_line_color='#22c55e', decreasing_line_color='#ef4444'
            )])
            fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ef4444", annotation_text=f"Stop: {stock['stop_loss']:.2f}")
            fig.add_hline(y=stock['target'], line_dash="dash", line_color="#22c55e", annotation_text=f"Target: {stock['target']:.2f}")
            fig.update_layout(height=450, xaxis_rangeslider_visible=False, template="plotly_white", margin=dict(l=0,r=0,t=20,b=0))
            st.plotly_chart(fig, use_container_width=True)
            
            # Teknisk analyse forklaring
            st.markdown("### 🔍 Teknisk Analyse")
            
            if stock['signal'] == "BUY":
                st.success(f"""
                **Kjøpssignal identifisert** for {stock['ticker_short']}
                
                Aksjen oppfyller alle kriterier for et kjøpssignal:
                - ✅ RSI ({stock['rsi']:.1f}) er under 55 - ikke overkjøpt
                - ✅ Pris er over SMA20 og SMA50 - positiv trend
                - ✅ EMA12 er over EMA26 - bullish momentum
                - ✅ Positiv utvikling siste 5 dager
                """)
            elif stock['signal'] == "SELL":
                st.error(f"""
                **Salgssignal identifisert** for {stock['ticker_short']}
                
                Tekniske indikatorer viser svakhet:
                - ⚠️ RSI kan være overkjøpt (>{stock['rsi']:.1f})
                - ⚠️ Pris kan være under viktige støttenivåer
                """)
            else:
                st.warning(f"""
                **Hold/Avvent** for {stock['ticker_short']}
                
                Aksjen mangler klar retning. Noen, men ikke alle kriterier er oppfylt.
                Avvent bekreftet breakout før du handler.
                """)
        
        with tab2:
            st.markdown("### 📋 Handelsplan")
            
            p1, p2, p3 = st.columns(3)
            with p1:
                st.markdown(f'<div class="info-box"><div class="info-value">{stock["pris"]:.2f} kr</div><div class="info-label">Anbefalt Inngang</div></div>', unsafe_allow_html=True)
            with p2:
                st.markdown(f'<div class="info-box"><div class="info-value negative">{stock["stop_loss"]:.2f} kr</div><div class="info-label">Stop Loss (2x ATR)</div></div>', unsafe_allow_html=True)
            with p3:
                st.markdown(f'<div class="info-box"><div class="info-value positive">{stock["target"]:.2f} kr</div><div class="info-label">Teknisk Target</div></div>', unsafe_allow_html=True)
            
            st.markdown("<br>", unsafe_allow_html=True)
            
            # R:R Ratio
            rr_ratio = stock['pot_kr'] / stock['risk_kr'] if stock['risk_kr'] > 0 else 0
            rr_color = "#22c55e" if rr_ratio >= 2 else "#f59e0b" if rr_ratio >= 1 else "#ef4444"
            rr_status = "✅ God" if rr_ratio >= 2 else "⚠️ Moderat" if rr_ratio >= 1 else "❌ Lav"
            
            r1, r2 = st.columns(2)
            with r1:
                st.markdown(f"""
                <div class="info-box">
                    <div class="info-value" style="color: {rr_color};">{rr_ratio:.2f}</div>
                    <div class="info-label">Risiko/Belønning Ratio</div>
                    <div style="font-size: 0.8rem; color: #6b7280; margin-top: 4px;">{rr_status} · Anbefalt: over 2.0</div>
                </div>
                """, unsafe_allow_html=True)
            with r2:
                st.markdown(f"""
                <div class="info-box">
                    <div class="info-value">3-6 uker</div>
                    <div class="info-label">Tidsestimat (Swing)</div>
                </div>
                """, unsafe_allow_html=True)
        
        with tab3:
            st.markdown("### 👤 Innsidehandel & Eierskap")
            
            # Hent innsidehandel data fra yfinance
            try:
                ticker_obj = yf.Ticker(stock['ticker'])
                
                # Insider transactions
                insider_trades = ticker_obj.insider_transactions
                if insider_trades is not None and not insider_trades.empty:
                    st.markdown("**Siste innsidehandler:**")
                    # Vis de siste 10 transaksjonene
                    display_insider = insider_trades.head(10).copy()
                    st.dataframe(display_insider, use_container_width=True, hide_index=True)
                else:
                    st.info("Ingen innsidehandler tilgjengelig fra yfinance for denne aksjen.")
                
                # Major holders
                st.markdown("<br>", unsafe_allow_html=True)
                st.markdown("**Største eiere:**")
                major_holders = ticker_obj.major_holders
                if major_holders is not None and not major_holders.empty:
                    st.dataframe(major_holders, use_container_width=True, hide_index=True)
                else:
                    st.info("Eierskapsdata ikke tilgjengelig.")
                    
            except Exception as e:
                st.info("Kunne ikke hente innsidedata. Prøv å sjekke Newsweb direkte.")
            
            # Link til Newsweb
            st.markdown("<br>", unsafe_allow_html=True)
            st.markdown(f"""
            <div style="background: #fef3c7; padding: 16px; border-radius: 12px; border: 2px solid #fbbf24;">
                <h4 style="margin: 0 0 8px 0; color: #92400e;">⚠️ Sjekk Newsweb</h4>
                <p style="margin: 0 0 12px 0; color: #78350f; font-size: 0.9rem;">
                    For fullstendig oversikt over meldepliktige handler og flaggemeldinger, 
                    sjekk alltid Newsweb før du handler.
                </p>
                <a href="https://newsweb.oslobors.no/search?category=1&issuer={stock['ticker_short']}" 
                   target="_blank" 
                   style="display: inline-block; background: #1a1a1a; color: white; padding: 10px 20px; 
                          border-radius: 8px; text-decoration: none; font-weight: 700;">
                    🔗 Åpne Newsweb for {stock['ticker_short']}
                </a>
            </div>
            """, unsafe_allow_html=True)
        
        with tab4:
            st.markdown("### 📰 Siste Nyheter")
            
            # Hent nyheter fra yfinance
            try:
                ticker_obj = yf.Ticker(stock['ticker'])
                news = ticker_obj.news
                
                if news and len(news) > 0:
                    for article in news[:8]:
                        pub_date = datetime.fromtimestamp(article.get('providerPublishTime', 0)).strftime('%d.%m.%Y')
                        st.markdown(f"""
                        <div style="background: white; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 12px;">
                            <a href="{article.get('link', '#')}" target="_blank" style="text-decoration: none;">
                                <h4 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 1rem;">{article.get('title', 'Ingen tittel')}</h4>
                            </a>
                            <div style="display: flex; gap: 16px; font-size: 0.8rem; color: #6b7280;">
                                <span>📅 {pub_date}</span>
                                <span>📰 {article.get('publisher', 'Ukjent kilde')}</span>
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                else:
                    st.info("Ingen nyheter tilgjengelig fra yfinance.")
                    
            except Exception as e:
                st.info("Kunne ikke hente nyheter.")
            
            # Eksterne kilder
            st.markdown("<br>", unsafe_allow_html=True)
            st.markdown("**🔗 Eksterne kilder:**")
            col1, col2, col3 = st.columns(3)
            with col1:
                st.markdown(f"[📊 Yahoo Finance](https://finance.yahoo.com/quote/{stock['ticker']})")
            with col2:
                st.markdown(f"[📈 TradingView](https://www.tradingview.com/symbols/OSL-{stock['ticker_short']}/)")
            with col3:
                st.markdown(f"[📰 Google News](https://news.google.com/search?q={stock['ticker_short']}+Oslo+Børs)")

with c_side:
    st.markdown("<br><br>", unsafe_allow_html=True)
    
    st.markdown(f"""
    <div class="widget-box">
        <h3 style="margin:0 0 16px 0;font-weight:700;font-size:1rem;">Markedsstatus</h3>
        <p style="color:#6b7280;font-size:0.9rem;margin:0;">{len(data)} aksjer analysert</p>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="help-card">
        <h3 style="margin:0 0 8px 0;font-weight:700;">Trenger du hjelp?</h3>
        <p style="opacity:0.9;font-size:0.9rem;margin:0 0 16px 0;">Support for analyser og strategi.</p>
        <div style="background:#E2FF3B;color:#1a1a1a;padding:12px;border-radius:12px;text-align:center;font-weight:700;">
            Kontakt Support
        </div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("---")
st.caption("K-man Island © 2026 · Ikke finansiell rådgivning")
