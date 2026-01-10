import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime

# ============================================
# 1. KONFIGURASJON & APP SETUP
# ============================================
st.set_page_config(
    page_title="K-man Island | Intelligence",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Session State for interaktivitet
if 'selected_ticker' not in st.session_state:
    st.session_state.selected_ticker = None
if 'view' not in st.session_state:
    st.session_state.view = 'Dashboard'
if 'selected_nav' not in st.session_state:
    st.session_state.selected_nav = 'home'

# ============================================
# 2. DESIGN (Lekent og moderne)
# ============================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Hovedoverstyring */
html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1a1a1a;
    background-color: #F8F7F4;
}

.stApp {
    background-color: #F8F7F4;
}

/* Modern glassmorphism header */
.top-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    padding: 1rem 2rem;
    margin: -1rem -1rem 2rem -1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

/* Sidebar styling */
section[data-testid="stSidebar"] {
    background-color: #ffffff !important;
    border-right: 1px solid #f0f0f0;
}

/* Left Navigation Sidebar */
.left-sidebar {
    background: #1e293b;
    color: white;
    padding: 2rem 1rem;
    min-height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    width: 80px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.nav-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: #94a3b8;
    font-size: 1.5rem;
}

.nav-icon:hover {
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    color: white;
    transform: scale(1.1);
}

.nav-icon.active {
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    color: white;
}

[data-testid="stAppViewContainer"] {
    margin-left: 80px;
}

/* Profilkort-stil */
.profile-card {
    background: white;
    border-radius: 32px;
    padding: 30px;
    display: flex;
    align-items: center;
    gap: 25px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
    margin-bottom: 30px;
    border: 1px solid #f0f0f0;
}
.profile-img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: #f0f0f0;
    overflow: hidden;
}

/* Status-kort (Lime, Teal, Pink) */
.status-card {
    border-radius: 28px;
    padding: 30px;
    color: #1a1a1a;
    height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s;
    position: relative;
}
.status-card:hover { transform: translateY(-5px); }
.card-lime { background-color: #E2FF3B; }
.card-teal { background-color: #A3E7D8; }
.card-pink { background-color: #FFB5B5; }

.status-number { font-size: 3.5rem; font-weight: 800; line-height: 1; }
.status-label { font-size: 1.1rem; font-weight: 700; }
.status-icon-bg {
    position: absolute;
    top: 25px;
    right: 25px;
    width: 40px;
    height: 40px;
    background: rgba(0,0,0,0.05);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Quick stats cards */
.quick-stat {
    background: white;
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.quick-stat:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.quick-stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
}

.quick-stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0.5rem 0;
}

.quick-stat-label {
    font-size: 0.85rem;
    color: #64748b;
}

/* Innholdskort (Aksjer) */
.content-card {
    background: #ffffff;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    margin-bottom: 24px;
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;
}
.content-card:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }

.card-img-top {
    height: 160px;
    background: linear-gradient(135deg, #2d3436 0%, #000000 100%);
    position: relative;
}
.badge-top {
    position: absolute;
    top: 15px;
    left: 15px;
    padding: 6px 14px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 800;
}
.badge-ongoing { background-color: #E2FF3B; color: #1a1a1a; }
.badge-done { background-color: #A3E7D8; color: #1a1a1a; }
.badge-sell { background-color: #FFB5B5; color: #1a1a1a; }

.card-body { padding: 25px; }
.card-title { font-size: 1.3rem; font-weight: 800; margin-bottom: 10px; }

/* Progress bar fra bildet */
.prog-container { margin-top: 20px; }
.prog-bar-bg { background-color: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden; }
.prog-bar-fill { height: 100%; border-radius: 4px; transition: width 1s; }

/* Høyre widgets */
.widget-box {
    background: white;
    border-radius: 28px;
    padding: 25px;
    margin-bottom: 20px;
    border: 1px solid #f0f0f0;
}
.help-card {
    background: linear-gradient(135deg, #2563EB, #1E40AF);
    border-radius: 28px;
    padding: 30px;
    color: white;
}

/* Filter bar */
.filter-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;
    align-items: center;
}
.filter-item {
    padding: 10px 20px;
    background: white;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    border: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    gap: 8px;
}
.filter-active { background: #1a1a1a; color: white; }

/* Analyse visning */
.big-ticker { font-size: 4rem; font-weight: 800; letter-spacing: -2px; line-height: 1; }

/* Info boxes */
.info-box {
    background: white;
    border-radius: 16px;
    padding: 20px;
    border: 1px solid #e2e8f0;
    text-align: center;
}

.info-value {
    font-size: 1.5rem;
    font-weight: 800;
}

.info-label {
    font-size: 0.8rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.positive { color: #16a34a; }
.negative { color: #dc2626; }

/* Live indicator */
.live-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #dcfce7;
    color: #166534;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
}

.live-dot {
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.9); }
}
</style>
""", unsafe_allow_html=True)

# ============================================
# 3. DATA MOTOR - Med riktige beregninger
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
            
            # Tekniske indikatorer
            rsi = ta.rsi(df['Close'], length=14).iloc[-1]
            sma20 = ta.sma(df['Close'], length=20).iloc[-1]
            sma50 = ta.sma(df['Close'], length=50).iloc[-1]
            atr = ta.atr(df['High'], df['Low'], df['Close'], length=14).iloc[-1]
            ema12 = ta.ema(df['Close'], length=12).iloc[-1]
            ema26 = ta.ema(df['Close'], length=26).iloc[-1]
            
            if pd.isna(rsi) or pd.isna(sma20) or pd.isna(atr): continue
            
            # Finn motstandsnivå (target)
            recent_highs = df['High'].tail(60).values
            resistance_levels = []
            for i in range(1, len(recent_highs) - 1):
                if recent_highs[i] > recent_highs[i-1] and recent_highs[i] > recent_highs[i+1]:
                    resistance_levels.append(recent_highs[i])
            
            above_current = [r for r in resistance_levels if r > close]
            target = min(above_current) if above_current else close * 1.10
            
            # Stop loss basert på ATR
            stop_loss = close - (2 * atr)
            
            # Beregn gevinstpotensial og risiko
            pot_kr = target - close
            pot_pct = (pot_kr / close) * 100
            risk_kr = close - stop_loss
            risk_pct = (risk_kr / close) * 100
            
            # Signal-logikk
            five_day_return = (close / float(df['Close'].iloc[-5])) - 1 if len(df) >= 5 else 0
            
            is_buy = (rsi < 55 and close > sma20 and close > sma50 and ema12 > ema26 and five_day_return > 0)
            is_sell = rsi > 75 or (close < sma20 and close < sma50)
            
            signal = "BUY" if is_buy else "SELL" if is_sell else "HOLD"
            
            results.append({
                "ticker": t,
                "ticker_short": t.replace('.OL', ''),
                "pris": round(close, 2),
                "endring": round(change_pct, 2),
                "rsi": round(rsi, 1),
                "signal": signal,
                "target": round(target, 2),
                "stop_loss": round(stop_loss, 2),
                "pot_kr": round(pot_kr, 2),
                "pot_pct": round(pot_pct, 1),
                "risk_kr": round(risk_kr, 2),
                "risk_pct": round(risk_pct, 1),
                "df": df
            })
        except: continue
    
    # SORTERING: Høyest gevinstpotensial (%) først, prioriter BUY signaler
    return sorted(results, key=lambda x: (
        0 if x['signal'] == 'BUY' else 1 if x['signal'] == 'HOLD' else 2,
        -x['pot_pct']
    ))

# ============================================
# 4. LEFT NAVIGATION SIDEBAR
# ============================================
nav_items = [
    {'icon': '🏝️', 'id': 'home', 'label': 'Oversikt'},
    {'icon': '📊', 'id': 'dashboard', 'label': 'Dashboard'},
    {'icon': '📈', 'id': 'analytics', 'label': 'Analytics'},
    {'icon': '📋', 'id': 'watchlist', 'label': 'Watchlist'},
    {'icon': '⚙️', 'id': 'settings', 'label': 'Innstillinger'}
]

nav_html = '<div class="left-sidebar">'
for item in nav_items:
    active_class = 'active' if st.session_state.selected_nav == item['id'] else ''
    nav_html += f'<div class="nav-icon {active_class}" title="{item["label"]}">{item["icon"]}</div>'
nav_html += '</div>'
st.markdown(nav_html, unsafe_allow_html=True)

# ============================================
# 5. SIDEBAR MENY
# ============================================
with st.sidebar:
    st.markdown("<div style='padding: 20px 0;'><h1 style='font-size: 1.8rem; font-weight: 800;'>🏝️ K-man</h1></div>", unsafe_allow_html=True)
    if st.button("🏠  Dashboard", use_container_width=True):
        st.session_state.view = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
    if st.button("📊  Børsoversikt", use_container_width=True):
        st.session_state.view = 'Scanner'
        st.session_state.selected_ticker = None
        st.rerun()
    st.markdown("---")
    st.markdown(f"""
    <span class="live-badge">
        <span class="live-dot"></span>
        {datetime.now().strftime('%H:%M')} · Live
    </span>
    """, unsafe_allow_html=True)

# ============================================
# 6. HOVEDINNHOLD
# ============================================
data = fetch_and_analyze()

if not data:
    st.warning("Kunne ikke hente data. Børsen kan være stengt.")
    st.stop()

# Layout (Hovedfelt vs Høyre felt)
c_main, c_side = st.columns([3, 1])

with c_main:
    # --- DASHBOARD VISNING ---
    if st.session_state.view == 'Dashboard' and not st.session_state.selected_ticker:
        # Header
        col_title, col_btn = st.columns([2, 1])
        with col_title:
            st.markdown("<h1 style='font-size: 2.5rem; font-weight: 800; margin-bottom: 40px;'>Oversikt</h1>", unsafe_allow_html=True)
        with col_btn:
            if st.button("🔄 Oppdater", use_container_width=True):
                st.cache_data.clear()
                st.rerun()

        # Bruker-profil kort
        st.markdown(f"""
            <div class="profile-card">
                <div class="profile-img"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Kman" style="width:100%"></div>
                <div style="flex-grow: 1;">
                    <h2 style="margin:0; font-weight:800;">K-man Investor</h2>
                    <p style="margin:0; color:#86868b; font-weight:600;">Strategisk Porteføljestyring · Oslo Børs</p>
                    <div style="display:flex; gap:20px; margin-top:10px; font-size:0.9rem; color:#444;">
                        <span>📍 Oslo & Viken</span>
                        <span>📈 Aktiv nå</span>
                    </div>
                </div>
            </div>
        """, unsafe_allow_html=True)

        # Status-kort rad
        buys = len([d for d in data if d['signal'] == 'BUY'])
        holds = len([d for d in data if d['signal'] == 'HOLD'])
        sells = len([d for d in data if d['signal'] == 'SELL'])
        
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown(f'<div class="status-card card-lime"><div class="status-icon-bg">🚀</div><div class="status-number">{buys}</div><div class="status-label">Kjøpssignaler</div></div>', unsafe_allow_html=True)
        with c2:
            st.markdown(f'<div class="status-card card-teal"><div class="status-icon-bg">⏸️</div><div class="status-number">{holds}</div><div class="status-label">Hold</div></div>', unsafe_allow_html=True)
        with c3:
            st.markdown(f'<div class="status-card card-pink"><div class="status-icon-bg">⚠️</div><div class="status-number">{sells}</div><div class="status-label">Salgssignaler</div></div>', unsafe_allow_html=True)

        # Dagens Muligheter
        st.markdown("<h2 style='font-size: 1.8rem; font-weight: 800; margin: 40px 0 10px 0;'>🎯 Dagens Muligheter</h2>", unsafe_allow_html=True)
        st.markdown("<p style='color: #64748b; margin-bottom: 20px;'>Sortert etter høyest gevinstpotensial</p>", unsafe_allow_html=True)

        # Filter bar
        st.markdown("""
            <div class="filter-bar">
                <div class="filter-item filter-active">📊 Alle</div>
                <div class="filter-item">🟢 Kjøp</div>
                <div class="filter-item">🟡 Hold</div>
            </div>
        """, unsafe_allow_html=True)

        # Grid med aksjekort - Viser direkte info
        display_picks = data[:6]
        cols = st.columns(2)
        for i, stock in enumerate(display_picks):
            with cols[i % 2]:
                badge_type = "badge-ongoing" if stock['signal'] == "BUY" else "badge-sell" if stock['signal'] == "SELL" else "badge-done"
                signal_text = "KJØP" if stock['signal'] == "BUY" else "SELG" if stock['signal'] == "SELL" else "HOLD"
                
                st.markdown(f"""
                    <div class="content-card">
                        <div class="card-img-top">
                            <span class="badge-top {badge_type}">{signal_text}</span>
                            <div style="position: absolute; bottom: 20px; left: 25px; color: white;">
                                <h3 style="margin:0; font-size: 1.8rem; font-weight: 800;">{stock['ticker_short']}</h3>
                                <span style="font-size: 0.9rem; opacity: 0.8;">Oslo Børs · #{i+1}</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div style="display: flex; justify-content: space-between; align-items: end;">
                                <div>
                                    <div style="font-size: 0.75rem; color:#888; text-transform:uppercase; font-weight: 600;">Pris</div>
                                    <div style="font-size: 1.5rem; font-weight: 800;">{stock['pris']:.2f} NOK</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 0.75rem; color:#888; text-transform:uppercase; font-weight: 600;">RSI</div>
                                    <div style="font-size: 1.2rem; font-weight: 700;">{stock['rsi']:.1f}</div>
                                </div>
                            </div>
                            
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #f0f0f0;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                                    <div>
                                        <div style="font-size: 0.7rem; color:#888; text-transform:uppercase; font-weight: 600;">Gevinstpotensial</div>
                                        <div style="font-size: 1.1rem; font-weight: 800; color: #16a34a;">+{stock['pot_kr']:.2f} kr / +{stock['pot_pct']:.1f}%</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 0.7rem; color:#888; text-transform:uppercase; font-weight: 600;">Risiko</div>
                                        <div style="font-size: 1.1rem; font-weight: 800; color: #dc2626;">-{stock['risk_kr']:.2f} kr / -{stock['risk_pct']:.1f}%</div>
                                    </div>
                                </div>
                                
                                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #64748b;">
                                    <span>Target: <strong>{stock['target']:.2f}</strong></span>
                                    <span>Stop: <strong>{stock['stop_loss']:.2f}</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                """, unsafe_allow_html=True)
                if st.button(f"📈 Åpne {stock['ticker_short']}", key=f"dash_{stock['ticker']}", use_container_width=True):
                    st.session_state.selected_ticker = stock['ticker']
                    st.rerun()

    # --- ANALYSE VISNING ---
    elif st.session_state.selected_ticker:
        stock = next((d for d in data if d['ticker'] == st.session_state.selected_ticker), None)
        if not stock:
            st.error("Fant ikke aksjen")
            st.stop()
            
        if st.button("⬅️ Tilbake til oversikt"):
            st.session_state.selected_ticker = None
            st.rerun()
            
        st.markdown(f"<h1 class='big-ticker'>{stock['ticker_short']}</h1>", unsafe_allow_html=True)
        
        # Info-kort rad
        info_cols = st.columns(5)
        with info_cols[0]:
            badge_type = "badge-ongoing" if stock['signal'] == "BUY" else "badge-sell" if stock['signal'] == "SELL" else "badge-done"
            signal_text = "KJØP" if stock['signal'] == "BUY" else "SELG" if stock['signal'] == "SELL" else "HOLD"
            st.markdown(f'<div class="info-box"><span class="badge-top {badge_type}" style="position:static;">{signal_text}</span><div class="info-label" style="margin-top:8px;">Signal</div></div>', unsafe_allow_html=True)
        with info_cols[1]:
            st.markdown(f'<div class="info-box"><div class="info-value">{stock["pris"]:.2f}</div><div class="info-label">Pris (NOK)</div></div>', unsafe_allow_html=True)
        with info_cols[2]:
            st.markdown(f'<div class="info-box"><div class="info-value positive">+{stock["pot_pct"]:.1f}%</div><div class="info-label">Gevinstpotensial</div></div>', unsafe_allow_html=True)
        with info_cols[3]:
            st.markdown(f'<div class="info-box"><div class="info-value negative">-{stock["risk_pct"]:.1f}%</div><div class="info-label">Risiko</div></div>', unsafe_allow_html=True)
        with info_cols[4]:
            st.markdown(f'<div class="info-box"><div class="info-value">{stock["rsi"]:.1f}</div><div class="info-label">RSI</div></div>', unsafe_allow_html=True)
        
        # Graf
        df_p = stock['df'].tail(90)
        fig = go.Figure(data=[go.Candlestick(
            x=df_p.index, open=df_p['Open'], high=df_p['High'], low=df_p['Low'], close=df_p['Close'],
            increasing_line_color='#22c55e', decreasing_line_color='#ef4444'
        )])
        fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ef4444", annotation_text=f"Stop: {stock['stop_loss']:.2f}")
        fig.add_hline(y=stock['target'], line_dash="dash", line_color="#22c55e", annotation_text=f"Target: {stock['target']:.2f}")
        fig.update_layout(height=500, xaxis_rangeslider_visible=False, template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)
        
        # Handelsplan
        st.markdown("### 📋 Handelsplan")
        plan_cols = st.columns(3)
        with plan_cols[0]:
            st.markdown(f'<div class="info-box"><div class="info-value">{stock["pris"]:.2f}</div><div class="info-label">Inngang</div></div>', unsafe_allow_html=True)
        with plan_cols[1]:
            st.markdown(f'<div class="info-box"><div class="info-value negative">{stock["stop_loss"]:.2f}</div><div class="info-label">Stop Loss (-{stock["risk_kr"]:.2f} kr)</div></div>', unsafe_allow_html=True)
        with plan_cols[2]:
            st.markdown(f'<div class="info-box"><div class="info-value positive">{stock["target"]:.2f}</div><div class="info-label">Target (+{stock["pot_kr"]:.2f} kr)</div></div>', unsafe_allow_html=True)

    # --- SCANNER VISNING ---
    elif st.session_state.view == 'Scanner':
        st.markdown("<h1 style='font-size: 2.5rem; font-weight: 800; margin-bottom: 20px;'>📋 Børsoversikt</h1>", unsafe_allow_html=True)
        st.markdown("<p style='color: #64748b; margin-bottom: 30px;'>Sortert etter høyest gevinstpotensial</p>", unsafe_allow_html=True)
        
        # Lag DataFrame for visning
        df_display = pd.DataFrame([{
            "Ticker": d['ticker_short'],
            "Pris": f"{d['pris']:.2f} kr",
            "Signal": "🟢 KJØP" if d['signal'] == "BUY" else "🔴 SELG" if d['signal'] == "SELL" else "🟡 HOLD",
            "Gevinstpotensial": f"+{d['pot_kr']:.2f} kr / +{d['pot_pct']:.1f}%",
            "Risiko": f"-{d['risk_kr']:.2f} kr / -{d['risk_pct']:.1f}%",
            "RSI": f"{d['rsi']:.1f}"
        } for d in data])
        
        st.dataframe(df_display, hide_index=True, use_container_width=True, height=600)

with c_side:
    st.markdown("<br><br><br>", unsafe_allow_html=True)
    
    st.markdown("""
        <div class="widget-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin:0; font-size: 1.1rem; font-weight: 800;">Min Agenda</h3>
                <span style="font-size: 0.8rem; color: #888;">☀️ Oslo</span>
            </div>
            <div style="padding: 15px; background: #F8F7F4; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid #1a1a1a;">
                <div style="font-size: 0.75rem; color: #888; font-weight:700;">NESTE</div>
                <div style="font-weight: 800;">Oslo Børs Åpner</div>
                <div style="font-size: 0.85rem; color: #555;">09:00 Mandag</div>
            </div>
        </div>
        
        <div class="widget-box">
            <h3 style="margin:0; font-size: 1.1rem; font-weight: 800; margin-bottom: 15px;">Markedsstatus</h3>
            <div style="font-size: 0.85rem; color: #888; display: flex; justify-content: space-between; margin-bottom:10px;">
                <span>Analysert</span>
                <span>{} aksjer</span>
            </div>
            <div class="prog-bar-bg">
                <div class="prog-bar-fill" style="width: 100%; background-color: #22c55e;"></div>
            </div>
        </div>
        
        <div class="help-card">
            <h3 style="margin:0; font-size: 1.3rem; font-weight: 800; margin-bottom: 10px;">Trenger du hjelp?</h3>
            <p style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 25px;">Support for analyser og strategi.</p>
            <div style="background: #E2FF3B; color: #1a1a1a; padding: 15px; border-radius: 16px; text-align: center; font-weight: 800; font-size:1rem;">
                Kontakt Support
            </div>
        </div>
    """.format(len(data)), unsafe_allow_html=True)

st.markdown("---")
st.caption("K-man Island © 2026 | Data fra yfinance · Ikke finansiell rådgivning")
