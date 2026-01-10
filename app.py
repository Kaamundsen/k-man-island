import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd

# ============================================
# 1. KONFIGURASJON
# ============================================
st.set_page_config(page_title="K-man Island", layout="wide", initial_sidebar_state="collapsed")

# Session state for navigering
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
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

/* Header */
.main-title {
    font-size: 2.8rem;
    font-weight: 700;
    color: white;
    margin-bottom: 0;
}
.sub-title {
    color: #94a3b8;
    font-size: 1.1rem;
    margin-bottom: 2rem;
}

/* Cards */
.stock-card {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 16px;
    transition: all 0.3s ease;
    cursor: pointer;
}
.stock-card:hover {
    background: rgba(255,255,255,0.1);
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.card-ticker {
    font-size: 1.4rem;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
}
.card-price {
    font-size: 2rem;
    font-weight: 700;
    color: #f8fafc;
}
.card-change-up { color: #4ade80; font-weight: 600; }
.card-change-down { color: #f87171; font-weight: 600; }

/* Badges */
.badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.badge-buy { background: linear-gradient(135deg, #10b981, #059669); color: white; }
.badge-sell { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
.badge-hold { background: rgba(148,163,184,0.3); color: #cbd5e1; }

/* Stats */
.stat-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
}
.stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
}
.stat-label {
    color: #64748b;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* Buttons */
.stButton > button {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 12px 24px;
    font-weight: 600;
    transition: all 0.2s;
}
.stButton > button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(59,130,246,0.3);
}

/* Fix text colors */
.stMarkdown, .stText, p, span, label {
    color: #e2e8f0 !important;
}
h1, h2, h3 {
    color: white !important;
}

/* Metrics */
[data-testid="stMetricValue"] {
    color: white !important;
    font-size: 1.8rem !important;
}
[data-testid="stMetricLabel"] {
    color: #94a3b8 !important;
}
[data-testid="stMetricDelta"] svg {
    display: none;
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
    """Analyser en enkelt aksje og returner data dict"""
    try:
        df = yf.download(ticker, period="1y", interval="1d", progress=False)
        
        # Håndter yfinance MultiIndex
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
        
        if df.empty or len(df) < 60:
            return None
        
        # Tekniske indikatorer
        df['RSI'] = ta.rsi(df['Close'], length=14)
        df['SMA20'] = ta.sma(df['Close'], length=20)
        df['SMA50'] = ta.sma(df['Close'], length=50)
        
        # Hent siste verdier
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
        
        # Beregn endring
        change_pct = ((close - prev_close) / prev_close) * 100
        
        # Signal logikk
        buy_signal = (rsi < 55) and (close > sma20) and (prev_close <= prev_sma20)
        sell_signal = (rsi > 70) or (close < sma20 and prev_close >= prev_sma20)
        signal = "BUY" if buy_signal else "SELL" if sell_signal else "HOLD"
        
        # K-Score
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
    """Hent data for alle aksjer"""
    results = []
    for ticker in watchlist:
        data = analyze_stock(ticker)
        if data:
            results.append(data)
    return results

# ============================================
# 4. HEADER
# ============================================
st.markdown('<p class="main-title">🏝️ K-man Island</p>', unsafe_allow_html=True)
st.markdown('<p class="sub-title">Strategic Portfolio Intelligence — Oslo Børs</p>', unsafe_allow_html=True)

# ============================================
# 5. HENT DATA
# ============================================
with st.spinner('Skanner markedet...'):
    all_data = get_all_data()

if not all_data:
    st.error("Kunne ikke hente markedsdata. Børsen kan være stengt eller det er et nettverksproblem.")
    st.info("Data vises fra siste handelsdag. Prøv å oppdatere siden.")
    st.stop()

# Sorter etter score
all_data_sorted = sorted(all_data, key=lambda x: x['score'], reverse=True)

# ============================================
# 6. NAVIGASJON
# ============================================
nav_cols = st.columns([1, 1, 1, 4])
with nav_cols[0]:
    if st.button("🏠 Dashboard", use_container_width=True):
        st.session_state.view = 'dashboard'
        st.rerun()
with nav_cols[1]:
    if st.button("📊 Scanner", use_container_width=True):
        st.session_state.view = 'scanner'
        st.rerun()
with nav_cols[2]:
    if st.button("📈 Analyse", use_container_width=True):
        st.session_state.view = 'analyse'
        st.rerun()

st.markdown("---")

# ============================================
# 7. DASHBOARD VIEW
# ============================================
if st.session_state.view == 'dashboard':
    
    # Stats row
    st.markdown("### 📊 Markedsoversikt")
    s1, s2, s3, s4 = st.columns(4)
    
    buys = len([d for d in all_data if d['signal'] == 'BUY'])
    sells = len([d for d in all_data if d['signal'] == 'SELL'])
    bullish = len([d for d in all_data if d['trend'] == 'Bullish'])
    
    with s1:
        st.metric("Kjøpssignaler", buys)
    with s2:
        st.metric("Salgssignaler", sells)
    with s3:
        st.metric("Bullish Trend", bullish)
    with s4:
        st.metric("Analyserte", len(all_data))
    
    st.markdown("---")
    
    # Top opportunities
    st.markdown("### 🏆 Top 3 Opportunities")
    st.caption("Klikk på en aksje for å se detaljert analyse")
    
    top_3 = all_data_sorted[:3]
    cols = st.columns(3)
    
    for i, stock in enumerate(top_3):
        with cols[i]:
            badge_class = f"badge-{stock['signal'].lower()}"
            change_class = "card-change-up" if stock['endring'] >= 0 else "card-change-down"
            change_arrow = "▲" if stock['endring'] >= 0 else "▼"
            
            st.markdown(f"""
            <div class="stock-card">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <span class="card-ticker">{stock['ticker']}</span>
                    <span class="badge {badge_class}">{stock['signal']}</span>
                </div>
                <div class="card-price">{stock['pris']} NOK</div>
                <div class="{change_class}">{change_arrow} {abs(stock['endring'])}%</div>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: #64748b; font-size: 0.8rem;">K-Score: {stock['score']} | RSI: {stock['rsi']}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            if st.button(f"Analyser {stock['ticker']}", key=f"btn_{stock['ticker']}", use_container_width=True):
                st.session_state.selected_ticker = stock['ticker']
                st.session_state.view = 'analyse'
                st.rerun()

# ============================================
# 8. SCANNER VIEW
# ============================================
elif st.session_state.view == 'scanner':
    st.markdown("### 📊 Market Scanner")
    
    # Filter
    col_filter, _ = st.columns([1, 3])
    with col_filter:
        signal_filter = st.multiselect(
            "Filtrer på signal:",
            ["BUY", "SELL", "HOLD"],
            default=["BUY", "SELL", "HOLD"]
        )
    
    # Filtrer data
    filtered = [d for d in all_data_sorted if d['signal'] in signal_filter]
    
    # Lag DataFrame for visning
    df_display = pd.DataFrame([{
        "Ticker": d['ticker'],
        "Pris (NOK)": d['pris'],
        "Endring %": d['endring'],
        "RSI": d['rsi'],
        "K-Score": d['score'],
        "Trend": d['trend'],
        "Signal": d['signal']
    } for d in filtered])
    
    st.dataframe(
        df_display,
        use_container_width=True,
        height=500,
        column_config={
            "Endring %": st.column_config.NumberColumn(format="%.2f%%"),
            "Pris (NOK)": st.column_config.NumberColumn(format="%.2f"),
        }
    )
    
    # Velg for analyse
    st.markdown("---")
    selected = st.selectbox("Velg aksje for analyse:", [d['ticker'] for d in filtered])
    if st.button("Gå til analyse →"):
        st.session_state.selected_ticker = selected
        st.session_state.view = 'analyse'
        st.rerun()

# ============================================
# 9. ANALYSE VIEW
# ============================================
elif st.session_state.view == 'analyse':
    
    # Velg aksje
    tickers = [d['ticker'] for d in all_data_sorted]
    default_idx = 0
    if st.session_state.selected_ticker and st.session_state.selected_ticker in tickers:
        default_idx = tickers.index(st.session_state.selected_ticker)
    
    selected = st.selectbox("Velg aksje:", tickers, index=default_idx)
    st.session_state.selected_ticker = selected
    
    # Finn data
    stock_data = next(d for d in all_data if d['ticker'] == selected)
    df = stock_data['df'].tail(120)
    
    st.markdown(f"### 📈 {selected} — Teknisk Analyse")
    
    # Metrics row
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric("Pris", f"{stock_data['pris']} NOK", f"{stock_data['endring']}%")
    with m2:
        st.metric("RSI (14)", stock_data['rsi'])
    with m3:
        st.metric("K-Score", stock_data['score'])
    with m4:
        badge_class = f"badge-{stock_data['signal'].lower()}"
        st.markdown(f"""
        <div style="text-align: center;">
            <p style="color: #64748b; font-size: 0.8rem; margin-bottom: 8px;">SIGNAL</p>
            <span class="badge {badge_class}" style="font-size: 1rem; padding: 10px 24px;">{stock_data['signal']}</span>
        </div>
        """, unsafe_allow_html=True)
    
    # Chart
    fig = make_subplots(
        rows=2, cols=1, 
        shared_xaxes=True,
        vertical_spacing=0.08,
        row_heights=[0.7, 0.3]
    )
    
    # Candlestick
    fig.add_trace(go.Candlestick(
        x=df.index, 
        open=df['Open'], high=df['High'],
        low=df['Low'], close=df['Close'],
        name="Pris",
        increasing_line_color='#10b981',
        decreasing_line_color='#ef4444'
    ), row=1, col=1)
    
    # SMA linjer
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA20'], name="SMA 20", line=dict(color='#3b82f6', width=1.5)), row=1, col=1)
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA50'], name="SMA 50", line=dict(color='#f59e0b', width=2)), row=1, col=1)
    
    # RSI
    fig.add_trace(go.Scatter(x=df.index, y=df['RSI'], name="RSI", line=dict(color='#8b5cf6', width=2), fill='tozeroy', fillcolor='rgba(139,92,246,0.1)'), row=2, col=1)
    fig.add_hline(y=70, line_dash="dash", line_color="#ef4444", row=2, col=1)
    fig.add_hline(y=30, line_dash="dash", line_color="#10b981", row=2, col=1)
    
    fig.update_layout(
        height=600,
        xaxis_rangeslider_visible=False,
        template="plotly_dark",
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        margin=dict(l=0, r=0, t=30, b=0),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        font=dict(color='#94a3b8')
    )
    
    fig.update_xaxes(gridcolor='rgba(255,255,255,0.05)')
    fig.update_yaxes(gridcolor='rgba(255,255,255,0.05)')
    
    st.plotly_chart(fig, use_container_width=True)
    
    # Verdict
    st.markdown("### 📝 Vurdering")
    if stock_data['signal'] == "BUY":
        st.success(f"**KJØPSSIGNAL:** {selected} viser momentum-breakout. Prisen har brutt over SMA20 med RSI på {stock_data['rsi']}. Trend er {stock_data['trend'].lower()}.")
    elif stock_data['signal'] == "SELL":
        st.error(f"**SALGSSIGNAL:** {selected} viser tegn til svakhet. RSI er på {stock_data['rsi']}. Vurder gevinstsikring eller stop-loss.")
    else:
        st.info(f"**HOLD:** {selected} er i en nøytral fase. RSI på {stock_data['rsi']}. Vent på klarere tekniske signaler.")

# ============================================
# 10. FOOTER
# ============================================
st.markdown("---")
st.caption("© 2026 K-man Island Intelligence | Data fra yfinance | Ikke finansiell rådgivning")
