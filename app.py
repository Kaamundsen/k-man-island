import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
from plotly.subplots import make_subplots
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

# ============================================
# 2. APPLE-STYLE UI/UX (CSS)
# ============================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

/* Main Overrides */
html, body, [class*="css"] {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #1d1d1f;
}

.stApp {
    background-color: #ffffff;
}

/* Sidebar Styling */
section[data-testid="stSidebar"] {
    background-color: #f5f5f7 !important;
    border-right: 1px solid #d2d2d7;
}

/* Navigation Buttons */
.nav-btn {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    margin: 4px 0;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
    color: #424245;
    text-decoration: none;
}

/* Custom Card - Apple Style */
.stock-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 24px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    transition: all 0.3s cubic-bezier(0, 0, 0.5, 1);
    margin-bottom: 20px;
}
.stock-card:hover {
    transform: scale(1.02);
    box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.buy-badge {
    background: #34c759;
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
}

.ticker-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 12px 0 4px 0;
}

.price-text {
    font-size: 2.2rem;
    font-weight: 700;
    letter-spacing: -1px;
}

/* Info Grid on Card */
.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #f5f5f7;
}

.info-item label {
    display: block;
    font-size: 0.75rem;
    color: #86868b;
    font-weight: 500;
    margin-bottom: 2px;
}

.info-item span {
    font-size: 1rem;
    font-weight: 600;
}

.potential-up { color: #34c759; }
.risk-down { color: #ff3b30; }

/* Metrics */
[data-testid="stMetricValue"] {
    font-weight: 700 !important;
}

/* Header */
.main-header {
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 0.5rem;
}
</style>
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
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.droplevel(1)
            
            if df.empty or len(df) < 60: continue
            
            # Indikatorer
            df['RSI'] = ta.rsi(df['Close'], length=14)
            df['SMA20'] = ta.sma(df['Close'], length=20)
            df['SMA50'] = ta.sma(df['Close'], length=50)
            
            last = df.iloc[-1]
            prev = df.iloc[-2]
            
            close = float(last['Close'])
            rsi = float(last['RSI'])
            sma20 = float(last['SMA20'])
            sma50 = float(last['SMA50'])
            
            # Logikk
            is_buy = (rsi < 55) and (close > sma20) and (prev['Close'] <= prev['SMA20'])
            
            # Beregninger (3.5% Stop Loss, 10.5% Target for 3:1 R:R)
            stop_loss = close * 0.965
            target_price = close * 1.105
            
            risk_kr = close - stop_loss
            potential_kr = target_price - close
            
            # K-Score for sortering
            returns_3m = (close / float(df['Close'].iloc[-60])) - 1
            score = (returns_3m * 50) + (25 if 40 < rsi < 60 else 0)
            
            results.append({
                "ticker": t,
                "pris": round(close, 2),
                "endring": round(((close - prev['Close']) / prev['Close']) * 100, 2),
                "rsi": round(rsi, 1),
                "score": round(score, 1),
                "signal": "BUY" if is_buy else "HOLD",
                "stop_loss": round(stop_loss, 2),
                "target": round(target_price, 2),
                "risk_kr": round(risk_kr, 2),
                "potential_kr": round(potential_kr, 2),
                "df": df
            })
        except: continue
    
    # Sorter slik at BUY kommer først, deretter score
    return sorted(results, key=lambda x: (x['signal'] != 'BUY', -x['score']))

# ============================================
# 4. SIDEBAR (NAVIGASJON)
# ============================================
with st.sidebar:
    st.markdown("<h2 style='margin-bottom:20px;'>🏝️ K-man Island</h2>", unsafe_allow_html=True)
    
    if st.button("🏠 Dashboard", use_container_width=True):
        st.session_state.view = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
        
    if st.button("📊 Markedsskanner", use_container_width=True):
        st.session_state.view = 'Scanner'
        st.rerun()

    st.markdown("---")
    st.caption(f"Oppdatert: {datetime.now().strftime('%H:%M')}")

# ============================================
# 5. HOVEDINNHOLD
# ============================================
data = fetch_and_analyze()

if st.session_state.view == 'Dashboard':
    st.markdown("<p class='main-header'>Strategic Intelligence</p>", unsafe_allow_html=True)
    st.markdown("<p style='color:#86868b; margin-bottom:40px;'>AI-validerte muligheter på Oslo Børs</p>", unsafe_allow_html=True)

    # Top Picks Grid
    buy_picks = [d for d in data if d['signal'] == 'BUY']
    display_data = buy_picks[:6] if buy_picks else data[:6]
    
    cols = st.columns(3)
    for i, stock in enumerate(display_data):
        with cols[i % 3]:
            # HTML Card
            st.markdown(f"""
            <div class="stock-card">
                <span class="buy-badge" style="background:{'#34c759' if stock['signal'] == 'BUY' else '#86868b'}">{stock['signal']}</span>
                <div class="ticker-title">{stock['ticker']}</div>
                <div class="price-text">{stock['pris']} <span style="font-size:1rem; color:#86868b;">NOK</span></div>
                <div style="color:{'#34c759' if stock['endring'] >= 0 else '#ff3b30'}; font-weight:600;">
                    {'▲' if stock['endring'] >= 0 else '▼'} {abs(stock['endring'])}%
                </div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <label>Gevinstpotensial</label>
                        <span class="potential-up">+{stock['potential_kr']} kr / 10.5%</span>
                    </div>
                    <div class="info-item">
                        <label>Risiko (SL 3.5%)</label>
                        <span class="risk-down">-{stock['risk_kr']} kr / 3.5%</span>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            if st.button(f"Velg {stock['ticker']}", key=f"select_{stock['ticker']}", use_container_width=True):
                st.session_state.selected_ticker = stock['ticker']
                st.rerun()

    # Analyse Seksjon (vises kun når en aksje er valgt)
    if st.session_state.selected_ticker:
        st.markdown("---")
        stock = next(d for d in data if d['ticker'] == st.session_state.selected_ticker)
        
        st.markdown(f"### 📈 Analyse: {stock['ticker']}")
        
        # Plotly med SL og Target
        df_plot = stock['df'].tail(60)
        fig = go.Figure()

        # Candlestick
        fig.add_trace(go.Candlestick(
            x=df_plot.index, open=df_plot['Open'], high=df_plot['High'], 
            low=df_plot['Low'], close=df_plot['Close'], name="Pris"
        ))

        # Stop Loss Linje (Rød)
        fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ff3b30", 
                      annotation_text=f"STOP LOSS ({stock['stop_loss']})", annotation_position="bottom right")
        
        # Target Linje (Grønn)
        fig.add_hline(y=stock['target'], line_dash="dash", line_color="#34c759", 
                      annotation_text=f"TARGET ({stock['target']})", annotation_position="top right")

        fig.update_layout(
            height=600,
            xaxis_rangeslider_visible=False,
            template="plotly_white",
            margin=dict(l=0, r=0, t=30, b=0)
        )
        st.plotly_chart(fig, use_container_width=True)
        
        st.info(f"**Vurdering:** {stock['ticker']} er i en {'positiv' if stock['signal'] == 'BUY' else 'nøytral'} trend. Inngang nå gir et R/R-forhold på 3:1 mot target.")

elif st.session_state.view == 'Scanner':
    st.markdown("### 📊 Markedsskanner")
    df_scan = pd.DataFrame([{
        "Ticker": d['ticker'],
        "Pris": d['pris'],
        "Endring %": d['endring'],
        "Signal": d['signal'],
        "RSI": d['rsi'],
        "Potensial (kr)": d['potential_kr'],
        "Risiko (kr)": d['risk_kr']
    } for d in data])
    st.dataframe(df_scan, use_container_width=True, height=600)

st.markdown("---")
st.caption("K-man Island © 2026 | Strategiske signaler for Oslo Børs. Ikke finansiell rådgivning.")
