import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from datetime import datetime
import random

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
# 2. KICK ARSE DESIGN (CSS) - Apple Style + Vibrant
# ============================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Main Overrides */
html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1a1a1a;
    background-color: #F8F7F4;
}

.stApp {
    background-color: #F8F7F4;
}

/* Sidebar Styling */
section[data-testid="stSidebar"] {
    background-color: #ffffff !important;
    border-right: 1px solid #f0f0f0;
}

/* Content Cards - FETT DESIGN */
.content-card {
    background: #ffffff;
    border-radius: 28px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.04);
    margin-bottom: 24px;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 1px solid #f0f0f0;
}
.content-card:hover { 
    transform: translateY(-10px); 
    box-shadow: 0 20px 40px rgba(0,0,0,0.08);
}

.card-header-vibrant {
    height: 140px;
    background: linear-gradient(135deg, #1a1a1a 0%, #434343 100%);
    padding: 25px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.card-badge {
    padding: 6px 14px;
    border-radius: 14px;
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    width: fit-content;
}
.badge-buy { background-color: #E2FF3B; color: #1a1a1a; }
.badge-hold { background-color: #A3E7D8; color: #1a1a1a; }
.badge-sell { background-color: #FFB5B5; color: #1a1a1a; }

.card-ticker {
    font-size: 2rem;
    font-weight: 800;
    color: white;
    margin: 0;
}

.card-body {
    padding: 25px;
}

.card-price {
    font-size: 2.2rem;
    font-weight: 800;
    color: #1a1a1a;
    letter-spacing: -1px;
}

/* Info Grid - Gevinst/Risiko */
.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #f5f5f7;
}

.info-item label {
    display: block;
    font-size: 0.8rem;
    color: #86868b;
    font-weight: 600;
    margin-bottom: 4px;
    text-transform: uppercase;
}

.info-item span {
    font-size: 1.1rem;
    font-weight: 700;
}

.potential-up { color: #34c759; }
.risk-down { color: #ff3b30; }

/* Status Cards Row */
.status-card {
    border-radius: 24px;
    padding: 30px;
    color: #1a1a1a;
    height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.card-lime { background-color: #E2FF3B; }
.card-teal { background-color: #A3E7D8; }
.card-pink { background-color: #FFB5B5; }

.status-number { font-size: 3rem; font-weight: 800; }
.status-label { font-size: 1rem; font-weight: 700; opacity: 0.8; }

/* Analysis Page */
.back-btn {
    display: inline-flex;
    align-items: center;
    padding: 10px 20px;
    background: white;
    border-radius: 12px;
    color: #1a1a1a;
    font-weight: 700;
    text-decoration: none;
    border: 1px solid #f0f0f0;
    margin-bottom: 20px;
}

.section-title { font-size: 2rem; font-weight: 800; margin: 40px 0 25px 0; }

/* Override button to look like part of card */
.stButton > button {
    border-radius: 16px;
    font-weight: 700;
    padding: 12px;
    background-color: #1a1a1a;
    color: white;
    border: none;
}
.stButton > button:hover {
    background-color: #333;
    color: #E2FF3B;
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
            if df.empty or len(df) < 60: continue
            if isinstance(df.columns, pd.MultiIndex): df.columns = df.columns.droplevel(1)
            
            df['RSI'] = ta.rsi(df['Close'], length=14)
            df['SMA20'] = ta.sma(df['Close'], length=20)
            
            last = df.iloc[-1]
            prev = df.iloc[-2]
            close = float(last['Close'])
            rsi = float(last['RSI'])
            
            is_buy = (rsi < 55) and (close > df['SMA20'].iloc[-1]) and (prev['Close'] <= df['SMA20'].iloc[-2])
            is_sell = (rsi > 70) or (close < df['SMA20'].iloc[-1] and prev['Close'] >= df['SMA20'].iloc[-2])
            
            prob_score = 50
            if 35 < rsi < 50: prob_score += 20
            if close > df['SMA20'].iloc[-1]: prob_score += 10
            prob_score = min(max(prob_score, 15), 95)
            
            # Beregninger (3.5% SL, 10.5% Target)
            risk_kr = close * 0.035
            pot_kr = close * 0.105
            
            results.append({
                "ticker": t,
                "pris": round(close, 2),
                "endring": round(((close - prev['Close']) / prev['Close']) * 100, 2),
                "rsi": round(rsi, 1),
                "signal": "BUY" if is_buy else "SELL" if is_sell else "HOLD",
                "prob_score": prob_score,
                "stop_loss": round(close * 0.965, 2),
                "target": round(close * 1.105, 2),
                "risk_kr": round(risk_kr, 2),
                "pot_kr": round(pot_kr, 2),
                "df": df
            })
        except: continue
    
    def hotness_key(x):
        rank = {"BUY": 0, "HOLD": 1, "SELL": 2}
        return (rank.get(x['signal'], 3), -x['prob_score'])
        
    return sorted(results, key=hotness_key)

# ============================================
# 4. SIDEBAR
# ============================================
with st.sidebar:
    st.markdown("<div style='padding: 20px 0;'><h1 style='font-size: 1.8rem; font-weight: 800;'>🏝️ K-man Island</h1></div>", unsafe_allow_html=True)
    if st.button("🏠  Oversikt", use_container_width=True):
        st.session_state.view = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
    if st.button("📊  Scanner", use_container_width=True):
        st.session_state.view = 'Scanner'
        st.rerun()
    st.markdown("---")
    st.caption(f"Oppdatert: {datetime.now().strftime('%H:%M')}")

# ============================================
# 5. HOVEDINNHOLD
# ============================================
data = fetch_and_analyze()

if st.session_state.view == 'Dashboard' and not st.session_state.selected_ticker:
    st.markdown("<h1 style='font-size: 3rem; font-weight: 800; margin-bottom: 40px;'>Oversikt</h1>", unsafe_allow_html=True)
    
    # Stats Row
    c1, c2, c3 = st.columns(3)
    buys = len([d for d in data if d['signal'] == 'BUY'])
    holds = len([d for d in data if d['signal'] == 'HOLD'])
    sells = len([d for d in data if d['signal'] == 'SELL'])

    with c1: st.markdown(f'<div class="status-card card-lime"><div class="status-number">{buys}</div><div class="status-label">Hot Kjøp</div></div>', unsafe_allow_html=True)
    with c2: st.markdown(f'<div class="status-card card-teal"><div class="status-number">{holds}</div><div class="status-label">Stabile Hold</div></div>', unsafe_allow_html=True)
    with c3: st.markdown(f'<div class="status-card card-pink"><div class="status-number">{sells}</div><div class="status-label">Salg / Risk</div></div>', unsafe_allow_html=True)

    st.markdown("<h2 class='section-title'>Dagens Muligheter</h2>", unsafe_allow_html=True)
    
    # Grid med 2 kolonner for store, fete kort
    display_picks = data[:6]
    cols = st.columns(2)
    for i, stock in enumerate(display_picks):
        with cols[i % 2]:
            badge_class = f"badge-{stock['signal'].lower()}"
            
            # Card UI - FETT DESIGN
            st.markdown(f"""
            <div class="content-card">
                <div class="card-header-vibrant">
                    <span class="card-badge {badge_class}">{stock['signal']}</span>
                    <h3 class="card-ticker">{stock['ticker']}</h3>
                </div>
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: end;">
                        <div>
                            <div class="card-price">{stock['pris']} NOK</div>
                            <div style="color:{'#34c759' if stock['endring'] >= 0 else '#ff3b30'}; font-weight:700; font-size:1.1rem;">
                                {'▲' if stock['endring'] >= 0 else '▼'} {abs(stock['endring'])}%
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.8rem; color: #888; text-transform: uppercase; font-weight:700;">Probability</div>
                            <div style="font-size: 1.8rem; font-weight: 800; color: #1a1a1a;">{stock['prob_score']}%</div>
                        </div>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Gevinstpotensial</label>
                            <span class="potential-up">+{stock['pot_kr']} kr / 10.5%</span>
                        </div>
                        <div class="info-item">
                            <label>Risiko (3.5% SL)</label>
                            <span class="risk-down">-{stock['risk_kr']} kr / 3.5%</span>
                        </div>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
            # Rent og pent knappe-valg
            if st.button(f"Åpne Analyse for {stock['ticker']}", key=f"btn_{stock['ticker']}", use_container_width=True):
                st.session_state.selected_ticker = stock['ticker']
                st.rerun()

elif st.session_state.view == 'Scanner':
    st.markdown("<h1 class='section-title'>Full Børsoversikt</h1>", unsafe_allow_html=True)
    df_display = pd.DataFrame([{
        "Ticker": d['ticker'], "Signal": d['signal'], "Pris": d['pris'], 
        "RSI": d['rsi'], "Prob": f"{d['prob_score']}%"
    } for d in data])
    st.table(df_display)

# DETALJERT ANALYSE VIEW
if st.session_state.selected_ticker:
    stock = next(d for d in data if d['ticker'] == st.session_state.selected_ticker)
    
    # Back Button
    if st.button("⬅️ Tilbake til oversikt"):
        st.session_state.selected_ticker = None
        st.rerun()
        
    st.markdown(f"<h1 style='font-size: 3rem; font-weight: 800;'>{stock['ticker']} Analysis</h1>", unsafe_allow_html=True)
    
    col_l, col_r = st.columns([2, 1])
    with col_l:
        df_p = stock['df'].tail(90)
        fig = go.Figure()
        fig.add_trace(go.Candlestick(x=df_p.index, open=df_p['Open'], high=df_p['High'], low=df_p['Low'], close=df_p['Close'], name="Pris"))
        fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ff3b30", annotation_text="STOP LOSS")
        fig.add_hline(y=stock['target'], line_dash="dash", line_color="#34c759", annotation_text="TARGET")
        fig.update_layout(height=600, xaxis_rangeslider_visible=False, template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)
    
    with col_r:
        st.markdown(f"""
            <div style="background:white; padding:30px; border-radius:24px; border:1px solid #f0f0f0;">
                <h3 style="margin-top:0;">Handelsplan</h3>
                <p>Status: <span class="badge-buy" style="padding:4px 10px; border-radius:8px;">{stock['signal']}</span></p>
                <hr>
                <p>Inngang: <strong>{stock['pris']} NOK</strong></p>
                <p style="color:#34c759;">Target: <strong>{stock['target']} NOK</strong></p>
                <p style="color:#ff3b30;">Stop Loss: <strong>{stock['stop_loss']} NOK</strong></p>
                <hr>
                <p>Sannsynlighet for gevinst: <strong>{stock['prob_score']}%</strong></p>
            </div>
        """, unsafe_allow_html=True)

st.markdown("---")
st.caption("K-man Island © 2026 | Strategisk Intelligence.")
