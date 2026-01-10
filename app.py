import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd

# ============================================
# 1. KONFIGURASJON
# ============================================
st.set_page_config(page_title="K-man Island", layout="wide", initial_sidebar_state="expanded")

# Session state
if 'view' not in st.session_state:
    st.session_state.view = 'dashboard'
if 'selected_ticker' not in st.session_state:
    st.session_state.selected_ticker = None

# ============================================
# 2. STYLING
# ============================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

html, body, [class*="css"] {
    font-family: 'DM Sans', sans-serif;
}

.stApp {
    background-color: #f8fafc;
}

/* Sidebar - Hvit og ren */
section[data-testid="stSidebar"] {
    background: white;
    border-right: 1px solid #e2e8f0;
}
section[data-testid="stSidebar"] > div {
    padding-top: 1rem;
}

/* Sidebar logo */
.sidebar-logo {
    padding: 20px 24px 30px 24px;
    border-bottom: 1px solid #f1f5f9;
    margin-bottom: 20px;
}
.sidebar-logo h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
}
.sidebar-logo p {
    color: #64748b;
    font-size: 0.85rem;
    margin: 4px 0 0 0;
}

/* Nav buttons i sidebar */
section[data-testid="stSidebar"] .stButton > button {
    width: 100%;
    text-align: left;
    padding: 14px 20px;
    border: none;
    background: transparent;
    color: #64748b;
    font-weight: 500;
    font-size: 0.95rem;
    border-radius: 10px;
    margin-bottom: 4px;
    transition: all 0.15s ease;
}
section[data-testid="stSidebar"] .stButton > button:hover {
    background: #f1f5f9;
    color: #0f172a;
}
section[data-testid="stSidebar"] .stButton > button:focus {
    box-shadow: none;
}

/* Active nav state */
.nav-active > button {
    background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
    color: white !important;
}

/* Header */
.main-title {
    font-size: 2rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
}
.sub-title {
    color: #64748b;
    font-size: 1rem;
    margin-bottom: 1.5rem;
}

/* Stock Cards */
.stock-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    transition: all 0.2s ease;
    cursor: pointer;
    border: 1px solid #e2e8f0;
    position: relative;
}
.stock-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.1);
    border-color: #3b82f6;
}

.stock-card.buy-card {
    border-left: 4px solid #10b981;
}
.stock-card.sell-card {
    border-left: 4px solid #ef4444;
}
.stock-card.hold-card {
    border-left: 4px solid #94a3b8;
}

.card-rank {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #f1f5f9;
    color: #64748b;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.8rem;
}

.card-ticker {
    font-size: 0.85rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
}
.card-price {
    font-size: 2rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.2;
}
.card-change {
    font-size: 0.95rem;
    font-weight: 600;
    margin-top: 2px;
}
.change-up { color: #10b981; }
.change-down { color: #ef4444; }

/* Badges */
.badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.badge-buy { background: #dcfce7; color: #166534; }
.badge-sell { background: #fee2e2; color: #991b1b; }
.badge-hold { background: #f1f5f9; color: #64748b; }

/* Stats Cards */
.stat-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e2e8f0;
}
.stat-value {
    font-size: 2.2rem;
    font-weight: 700;
    color: #0f172a;
}
.stat-label {
    color: #64748b;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
}

/* Section headers */
.section-header {
    font-size: 1.2rem;
    font-weight: 700;
    color: #0f172a;
    margin: 1.5rem 0 1rem 0;
}

/* Card meta info */
.card-meta {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
    font-size: 0.8rem;
    color: #94a3b8;
}
.card-meta strong {
    color: #475569;
}

/* Click hint */
.click-hint {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 12px;
}

/* Hide button styling for card clicks */
.card-button > button {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    height: 0 !important;
    min-height: 0 !important;
    visibility: hidden !important;
}

/* Metrics */
[data-testid="stMetricValue"] {
    font-size: 1.5rem !important;
    font-weight: 700 !important;
    color: #0f172a !important;
}
[data-testid="stMetricLabel"] {
    color: #64748b !important;
}
</style>
""", unsafe_allow_html=True)

# ============================================
# 3. DATA MOTOR
# ============================================
watchlist = [
    "NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", 
    "BGBIO.OL", "TEL.OL", "ORK.OL", "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL", 
    "EQNR.OL", "YAR.OL", "NHY.OL", "MOWI.OL", "SUBC.OL", "TGS.OL", "AKRBP.OL", 
    "PGS.OL", "ADE.OL", "IDEX.OL", "AUTO.OL", "LSG.OL", "SALM.OL", "BAKK.OL", 
    "TOM.OL", "GRIEG.OL", "ELK.OL", "MPCC.OL", "KOG.OL", "BORR.OL", "RANA.OL", 
    "SCATC.OL", "VOW.OL", "OKEA.OL", "HAFNI.OL", "BWE.OL"
]

@st.cache_data(ttl=1800, show_spinner=False)
def analyze_stock(ticker):
    try:
        df = yf.download(ticker, period="1y", interval="1d", progress=False)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
        
        if df.empty or len(df) < 60:
            return None
        
        df['RSI'] = ta.rsi(df['Close'], length=14)
        df['SMA20'] = ta.sma(df['Close'], length=20)
        df['SMA50'] = ta.sma(df['Close'], length=50)
        
        last = df.iloc[-1]
        prev = df.iloc[-2]
        
        if pd.isna(last['RSI']) or pd.isna(last['SMA20']) or pd.isna(last['SMA50']):
            return None
        
        close = float(last['Close'])
        rsi = float(last['RSI'])
        sma20 = float(last['SMA20'])
        sma50 = float(last['SMA50'])
        prev_close = float(prev['Close'])
        prev_sma20 = float(prev['SMA20'])
        
        change_pct = ((close - prev_close) / prev_close) * 100
        
        buy_signal = (rsi < 55) and (close > sma20) and (prev_close <= prev_sma20)
        sell_signal = (rsi > 70) or (close < sma20 and prev_close >= prev_sma20)
        signal = "BUY" if buy_signal else "SELL" if sell_signal else "HOLD"
        
        returns_3m = (close / float(df['Close'].iloc[-60])) - 1
        score = (returns_3m * 50) + (25 if 40 < rsi < 60 else 0) + (10 if close > sma50 else -10)
        
        return {
            "ticker": ticker,
            "df": df,
            "pris": round(close, 2),
            "endring": round(change_pct, 2),
            "rsi": round(rsi, 1),
            "sma20": round(sma20, 2),
            "sma50": round(sma50, 2),
            "score": round(score, 1),
            "trend": "Bullish" if close > sma50 else "Bearish",
            "signal": signal
        }
    except Exception:
        return None

@st.cache_data(ttl=1800, show_spinner=False)
def get_all_data():
    results = []
    for ticker in watchlist:
        data = analyze_stock(ticker)
        if data:
            results.append(data)
    return results

# ============================================
# 4. SIDEBAR
# ============================================
with st.sidebar:
    # Logo
    st.markdown("""
    <div class="sidebar-logo">
        <h1>🏝️ K-man Island</h1>
        <p>Portfolio Intelligence</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Navigation buttons
    if st.button("🏠  Dashboard", use_container_width=True, key="nav_dash", 
                 type="primary" if st.session_state.view == 'dashboard' else "secondary"):
        st.session_state.view = 'dashboard'
        st.rerun()
    
    if st.button("📊  Scanner", use_container_width=True, key="nav_scan",
                 type="primary" if st.session_state.view == 'scanner' else "secondary"):
        st.session_state.view = 'scanner'
        st.rerun()
    
    if st.button("📈  Analyse", use_container_width=True, key="nav_analyse",
                 type="primary" if st.session_state.view == 'analyse' else "secondary"):
        st.session_state.view = 'analyse'
        st.rerun()
    
    st.markdown("---")
    st.caption("Data fra siste handelsdag")

# ============================================
# 5. HENT DATA
# ============================================
with st.spinner('Laster markedsdata...'):
    all_data = get_all_data()

if not all_data:
    st.error("Kunne ikke hente data. Prøv igjen senere.")
    st.stop()

def sort_key(item):
    signal_priority = {"BUY": 0, "SELL": 1, "HOLD": 2}
    return (signal_priority.get(item['signal'], 3), -item['score'])

all_data_sorted = sorted(all_data, key=sort_key)

# ============================================
# 6. DASHBOARD
# ============================================
if st.session_state.view == 'dashboard':
    
    st.markdown('<p class="main-title">Dashboard</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-title">Oversikt over dagens muligheter på Oslo Børs</p>', unsafe_allow_html=True)
    
    # Stats
    buys = len([d for d in all_data if d['signal'] == 'BUY'])
    sells = len([d for d in all_data if d['signal'] == 'SELL'])
    bullish = len([d for d in all_data if d['trend'] == 'Bullish'])
    
    s1, s2, s3, s4 = st.columns(4)
    with s1:
        st.markdown(f'<div class="stat-card"><div class="stat-value" style="color:#10b981">{buys}</div><div class="stat-label">Kjøpssignaler</div></div>', unsafe_allow_html=True)
    with s2:
        st.markdown(f'<div class="stat-card"><div class="stat-value" style="color:#ef4444">{sells}</div><div class="stat-label">Salgssignaler</div></div>', unsafe_allow_html=True)
    with s3:
        st.markdown(f'<div class="stat-card"><div class="stat-value">{bullish}</div><div class="stat-label">Bullish</div></div>', unsafe_allow_html=True)
    with s4:
        st.markdown(f'<div class="stat-card"><div class="stat-value">{len(all_data)}</div><div class="stat-label">Analyserte</div></div>', unsafe_allow_html=True)
    
    st.markdown('<p class="section-header">🏆 Top Muligheter</p>', unsafe_allow_html=True)
    
    top_stocks = all_data_sorted[:3]
    cols = st.columns(3)
    
    for i, stock in enumerate(top_stocks):
        with cols[i]:
            card_class = "buy-card" if stock['signal'] == "BUY" else "sell-card" if stock['signal'] == "SELL" else "hold-card"
            badge_class = f"badge-{stock['signal'].lower()}"
            change_class = "change-up" if stock['endring'] >= 0 else "change-down"
            arrow = "▲" if stock['endring'] >= 0 else "▼"
            
            st.markdown(f"""
            <div class="stock-card {card_class}">
                <div class="card-rank">{i+1}</div>
                <span class="badge {badge_class}">{stock['signal']}</span>
                <p class="card-ticker">{stock['ticker']}</p>
                <p class="card-price">{stock['pris']} <span style="font-size:0.9rem;color:#94a3b8;">NOK</span></p>
                <p class="card-change {change_class}">{arrow} {abs(stock['endring'])}%</p>
                <div class="card-meta">
                    K-Score: <strong>{stock['score']}</strong> · RSI: <strong>{stock['rsi']}</strong>
                </div>
                <p class="click-hint">Klikk for å se analyse →</p>
            </div>
            """, unsafe_allow_html=True)
            
            if st.button(f"Åpne {stock['ticker']}", key=f"top_{stock['ticker']}", use_container_width=True):
                st.session_state.selected_ticker = stock['ticker']
                st.session_state.view = 'analyse'
                st.rerun()

# ============================================
# 7. SCANNER
# ============================================
elif st.session_state.view == 'scanner':
    st.markdown('<p class="main-title">Scanner</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-title">Alle aksjer sortert etter signal og score</p>', unsafe_allow_html=True)
    
    col_filter, _ = st.columns([1, 3])
    with col_filter:
        signal_filter = st.multiselect("Filtrer:", ["BUY", "SELL", "HOLD"], default=["BUY", "SELL", "HOLD"])
    
    filtered = [d for d in all_data_sorted if d['signal'] in signal_filter]
    
    df_display = pd.DataFrame([{
        "Ticker": d['ticker'],
        "Pris": d['pris'],
        "Endring %": d['endring'],
        "RSI": d['rsi'],
        "K-Score": d['score'],
        "Trend": d['trend'],
        "Signal": d['signal']
    } for d in filtered])
    
    st.dataframe(df_display, use_container_width=True, height=450)
    
    st.markdown("---")
    col1, col2 = st.columns([3, 1])
    with col1:
        selected = st.selectbox("Velg aksje:", [d['ticker'] for d in filtered], label_visibility="collapsed")
    with col2:
        if st.button("Analyser →", use_container_width=True, type="primary"):
            st.session_state.selected_ticker = selected
            st.session_state.view = 'analyse'
            st.rerun()

# ============================================
# 8. ANALYSE
# ============================================
elif st.session_state.view == 'analyse':
    
    tickers = [d['ticker'] for d in all_data_sorted]
    default_idx = 0
    if st.session_state.selected_ticker and st.session_state.selected_ticker in tickers:
        default_idx = tickers.index(st.session_state.selected_ticker)
    
    selected = st.selectbox("Velg aksje:", tickers, index=default_idx)
    st.session_state.selected_ticker = selected
    
    stock_data = next(d for d in all_data if d['ticker'] == selected)
    df = stock_data['df'].tail(120)
    
    st.markdown(f'<p class="main-title">{selected}</p>', unsafe_allow_html=True)
    
    # Metrics
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric("Pris", f"{stock_data['pris']} NOK", f"{stock_data['endring']}%")
    with m2:
        st.metric("RSI", stock_data['rsi'])
    with m3:
        st.metric("K-Score", stock_data['score'])
    with m4:
        badge_class = f"badge-{stock_data['signal'].lower()}"
        st.markdown(f'<div style="padding-top:8px;"><span class="badge {badge_class}" style="font-size:0.9rem;padding:10px 20px;">{stock_data["signal"]}</span></div>', unsafe_allow_html=True)
    
    # Chart
    fig = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.08, row_heights=[0.7, 0.3])
    
    fig.add_trace(go.Candlestick(
        x=df.index, open=df['Open'], high=df['High'], low=df['Low'], close=df['Close'],
        name="Pris", increasing_line_color='#10b981', decreasing_line_color='#ef4444'
    ), row=1, col=1)
    
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA20'], name="SMA 20", line=dict(color='#3b82f6', width=1.5)), row=1, col=1)
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA50'], name="SMA 50", line=dict(color='#f59e0b', width=2)), row=1, col=1)
    
    fig.add_trace(go.Scatter(x=df.index, y=df['RSI'], name="RSI", line=dict(color='#8b5cf6', width=2)), row=2, col=1)
    fig.add_hline(y=70, line_dash="dash", line_color="#ef4444", row=2, col=1)
    fig.add_hline(y=30, line_dash="dash", line_color="#10b981", row=2, col=1)
    
    fig.update_layout(
        height=500, xaxis_rangeslider_visible=False, template="plotly_white",
        margin=dict(l=0, r=0, t=20, b=0),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Verdict
    if stock_data['signal'] == "BUY":
        st.success(f"**KJØP:** {selected} viser breakout over SMA20. RSI: {stock_data['rsi']}. Trend: {stock_data['trend']}.")
    elif stock_data['signal'] == "SELL":
        st.error(f"**SELG:** {selected} viser svakhet. RSI: {stock_data['rsi']}. Vurder stop-loss.")
    else:
        st.info(f"**HOLD:** {selected} er nøytral. RSI: {stock_data['rsi']}. Vent på signal.")

# Footer
st.markdown("---")
st.caption("K-man Island © 2026 | Ikke finansiell rådgivning")
