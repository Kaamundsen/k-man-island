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
# 2. STYLING - Hvit og moderne
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

/* Sidebar */
section[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
}
section[data-testid="stSidebar"] .stMarkdown p,
section[data-testid="stSidebar"] .stMarkdown span,
section[data-testid="stSidebar"] label {
    color: #e2e8f0 !important;
}
section[data-testid="stSidebar"] .stRadio label {
    color: white !important;
}

/* Sidebar navigation */
.nav-item {
    padding: 14px 20px;
    margin: 6px 0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #94a3b8;
    font-weight: 500;
}
.nav-item:hover {
    background: rgba(255,255,255,0.1);
    color: white;
}
.nav-item.active {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
}

/* Header */
.main-title {
    font-size: 2.2rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
}
.sub-title {
    color: #64748b;
    font-size: 1rem;
    margin-bottom: 1.5rem;
}

/* Stock Cards - Klikkbare */
.stock-card {
    background: white;
    border-radius: 20px;
    padding: 28px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    border: 2px solid transparent;
    position: relative;
    overflow: hidden;
}
.stock-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
}
.stock-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    border-color: #3b82f6;
}
.stock-card.buy-card::before {
    background: linear-gradient(90deg, #10b981, #059669);
}
.stock-card.sell-card::before {
    background: linear-gradient(90deg, #ef4444, #dc2626);
}

.card-rank {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #64748b;
    font-size: 0.9rem;
}

.card-ticker {
    font-size: 1.1rem;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.card-price {
    font-size: 2.4rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.1;
}
.card-price-small {
    font-size: 1rem;
    color: #94a3b8;
    font-weight: 500;
}
.card-change {
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 4px;
}
.change-up { color: #10b981; }
.change-down { color: #ef4444; }

/* Badges */
.badge {
    display: inline-block;
    padding: 8px 18px;
    border-radius: 30px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.badge-buy { 
    background: linear-gradient(135deg, #dcfce7, #bbf7d0); 
    color: #166534; 
}
.badge-sell { 
    background: linear-gradient(135deg, #fee2e2, #fecaca); 
    color: #991b1b; 
}
.badge-hold { 
    background: #f1f5f9; 
    color: #64748b; 
}

/* Stats Cards */
.stat-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    text-align: center;
}
.stat-value {
    font-size: 2.8rem;
    font-weight: 700;
    color: #0f172a;
}
.stat-label {
    color: #64748b;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
}
.stat-icon {
    font-size: 1.5rem;
    margin-bottom: 8px;
}

/* Click indicator */
.click-hint {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
    color: #94a3b8;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* Section headers */
.section-header {
    font-size: 1.4rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 10px;
}

/* Metrics styling */
[data-testid="stMetricValue"] {
    font-size: 1.6rem !important;
    font-weight: 700 !important;
    color: #0f172a !important;
}
[data-testid="stMetricLabel"] {
    color: #64748b !important;
}

/* Button overrides */
.stButton > button {
    border-radius: 12px;
    font-weight: 600;
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
    results = []
    for ticker in watchlist:
        data = analyze_stock(ticker)
        if data:
            results.append(data)
    return results

# ============================================
# 4. SIDEBAR NAVIGASJON
# ============================================
with st.sidebar:
    st.markdown("""
    <div style="padding: 20px 0 30px 0;">
        <p style="font-size: 1.8rem; font-weight: 700; color: white; margin: 0;">🏝️ K-man</p>
        <p style="color: #64748b; font-size: 0.9rem; margin: 0;">Island Intelligence</p>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Navigation
    nav_choice = st.radio(
        "Navigasjon",
        ["🏠 Dashboard", "📊 Scanner", "📈 Analyse"],
        label_visibility="collapsed"
    )
    
    if "Dashboard" in nav_choice:
        st.session_state.view = 'dashboard'
    elif "Scanner" in nav_choice:
        st.session_state.view = 'scanner'
    elif "Analyse" in nav_choice:
        st.session_state.view = 'analyse'
    
    st.markdown("---")
    st.caption("Sist oppdatert: Live data")

# ============================================
# 5. HENT DATA
# ============================================
with st.spinner('Skanner markedet...'):
    all_data = get_all_data()

if not all_data:
    st.error("Kunne ikke hente markedsdata. Børsen kan være stengt.")
    st.stop()

# SORTERING: BUY først, deretter etter score
def sort_key(item):
    signal_priority = {"BUY": 0, "SELL": 1, "HOLD": 2}
    return (signal_priority.get(item['signal'], 3), -item['score'])

all_data_sorted = sorted(all_data, key=sort_key)

# ============================================
# 6. DASHBOARD
# ============================================
if st.session_state.view == 'dashboard':
    
    # Header
    st.markdown('<p class="main-title">Velkommen tilbake 👋</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-title">Her er dagens markedsmuligheter på Oslo Børs</p>', unsafe_allow_html=True)
    
    # Stats
    buys = len([d for d in all_data if d['signal'] == 'BUY'])
    sells = len([d for d in all_data if d['signal'] == 'SELL'])
    bullish = len([d for d in all_data if d['trend'] == 'Bullish'])
    
    s1, s2, s3, s4 = st.columns(4)
    with s1:
        st.markdown(f"""
        <div class="stat-card">
            <div class="stat-icon">🚀</div>
            <div class="stat-value" style="color: #10b981;">{buys}</div>
            <div class="stat-label">Kjøpssignaler</div>
        </div>
        """, unsafe_allow_html=True)
    with s2:
        st.markdown(f"""
        <div class="stat-card">
            <div class="stat-icon">⚠️</div>
            <div class="stat-value" style="color: #ef4444;">{sells}</div>
            <div class="stat-label">Salgssignaler</div>
        </div>
        """, unsafe_allow_html=True)
    with s3:
        st.markdown(f"""
        <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-value">{bullish}</div>
            <div class="stat-label">Bullish Trend</div>
        </div>
        """, unsafe_allow_html=True)
    with s4:
        st.markdown(f"""
        <div class="stat-card">
            <div class="stat-icon">🔍</div>
            <div class="stat-value">{len(all_data)}</div>
            <div class="stat-label">Analyserte</div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Top Opportunities - Klikkbare kort
    st.markdown('<p class="section-header">🏆 Top Muligheter</p>', unsafe_allow_html=True)
    
    top_stocks = all_data_sorted[:3]
    cols = st.columns(3)
    
    for i, stock in enumerate(top_stocks):
        with cols[i]:
            card_class = "buy-card" if stock['signal'] == "BUY" else "sell-card" if stock['signal'] == "SELL" else ""
            badge_class = f"badge-{stock['signal'].lower()}"
            change_class = "change-up" if stock['endring'] >= 0 else "change-down"
            change_arrow = "▲" if stock['endring'] >= 0 else "▼"
            
            st.markdown(f"""
            <div class="stock-card {card_class}">
                <div class="card-rank">{i+1}</div>
                <span class="badge {badge_class}">{stock['signal']}</span>
                <p class="card-ticker" style="margin-top: 16px;">{stock['ticker']}</p>
                <p class="card-price">{stock['pris']} <span class="card-price-small">NOK</span></p>
                <p class="card-change {change_class}">{change_arrow} {abs(stock['endring'])}%</p>
                <div style="margin-top: 20px;">
                    <span style="color: #94a3b8; font-size: 0.85rem;">K-Score: <strong style="color: #0f172a;">{stock['score']}</strong></span>
                    <span style="color: #94a3b8; font-size: 0.85rem; margin-left: 16px;">RSI: <strong style="color: #0f172a;">{stock['rsi']}</strong></span>
                </div>
                <div class="click-hint">
                    <span>👆</span> Klikk for analyse
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Usynlig knapp som dekker kortet
            if st.button("Velg", key=f"card_{stock['ticker']}", use_container_width=True, type="secondary"):
                st.session_state.selected_ticker = stock['ticker']
                st.session_state.view = 'analyse'
                st.rerun()

# ============================================
# 7. SCANNER
# ============================================
elif st.session_state.view == 'scanner':
    st.markdown('<p class="main-title">📊 Market Scanner</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-title">Filtrer og finn de beste mulighetene</p>', unsafe_allow_html=True)
    
    # Filter
    col_filter, _ = st.columns([1, 3])
    with col_filter:
        signal_filter = st.multiselect(
            "Filtrer på signal:",
            ["BUY", "SELL", "HOLD"],
            default=["BUY", "SELL", "HOLD"]
        )
    
    filtered = [d for d in all_data_sorted if d['signal'] in signal_filter]
    
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
    
    st.markdown("---")
    col1, col2 = st.columns([2, 1])
    with col1:
        selected = st.selectbox("Velg aksje for detaljert analyse:", [d['ticker'] for d in filtered])
    with col2:
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("Gå til analyse →", use_container_width=True):
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
    
    st.markdown(f'<p class="main-title">📈 {selected}</p>', unsafe_allow_html=True)
    st.markdown(f'<p class="sub-title">Teknisk analyse og signalvurdering</p>', unsafe_allow_html=True)
    
    # Metrics
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
            <span class="badge {badge_class}" style="font-size: 1rem; padding: 12px 28px;">{stock_data['signal']}</span>
        </div>
        """, unsafe_allow_html=True)
    
    # Chart
    fig = make_subplots(
        rows=2, cols=1, 
        shared_xaxes=True,
        vertical_spacing=0.08,
        row_heights=[0.7, 0.3]
    )
    
    fig.add_trace(go.Candlestick(
        x=df.index, 
        open=df['Open'], high=df['High'],
        low=df['Low'], close=df['Close'],
        name="Pris",
        increasing_line_color='#10b981',
        decreasing_line_color='#ef4444'
    ), row=1, col=1)
    
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA20'], name="SMA 20", line=dict(color='#3b82f6', width=1.5)), row=1, col=1)
    fig.add_trace(go.Scatter(x=df.index, y=df['SMA50'], name="SMA 50", line=dict(color='#f59e0b', width=2)), row=1, col=1)
    
    fig.add_trace(go.Scatter(x=df.index, y=df['RSI'], name="RSI", line=dict(color='#8b5cf6', width=2), fill='tozeroy', fillcolor='rgba(139,92,246,0.1)'), row=2, col=1)
    fig.add_hline(y=70, line_dash="dash", line_color="#ef4444", row=2, col=1)
    fig.add_hline(y=30, line_dash="dash", line_color="#10b981", row=2, col=1)
    
    fig.update_layout(
        height=550,
        xaxis_rangeslider_visible=False,
        template="plotly_white",
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(248,250,252,1)',
        margin=dict(l=0, r=0, t=30, b=0),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    
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
# 9. FOOTER
# ============================================
st.markdown("---")
st.caption("© 2026 K-man Island Intelligence | Data fra yfinance | Ikke finansiell rådgivning")
