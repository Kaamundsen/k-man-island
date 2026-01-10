import streamlit as st
import yfinance as yf
import pandas_ta as ta
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime
import random

# ============================================
# 1. KONFIGURASJON
# ============================================
st.set_page_config(
    page_title="K-man Island | Intelligence",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Session State for navigering
if 'selected_ticker' not in st.session_state:
    st.session_state.selected_ticker = None
if 'page' not in st.session_state:
    st.session_state.page = 'Dashboard'

# ============================================
# 2. RENT & LUFTIG DESIGN (Apple-Style CSS)
# ============================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #1d1d1f;
    background-color: #ffffff;
}

.stApp {
    background-color: #ffffff;
}

/* Sidebar - Permanent & Synlig */
section[data-testid="stSidebar"] {
    background-color: #f5f5f7 !important;
    border-right: 1px solid #d2d2d7;
}

/* Navigasjons-knapper i Sidebar */
.stSidebar button {
    text-align: left !important;
    justify-content: flex-start !important;
    border: none !important;
    background: transparent !important;
    color: #1d1d1f !important;
    font-size: 1.1rem !important;
    font-weight: 600 !important;
    padding: 15px 20px !important;
}
.stSidebar button:hover {
    background-color: #e8e8ed !important;
}

/* --- AKSJEKORT DESIGN (APPLE-STYLE) --- */
.card-container {
    background: #ffffff;
    border-radius: 24px;
    padding: 30px;
    border: 1px solid #e5e5e7;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    transition: all 0.3s cubic-bezier(0, 0, 0.5, 1);
    margin-bottom: 25px;
    cursor: pointer;
}
.card-container:hover {
    transform: scale(1.02);
    box-shadow: 0 12px 24px rgba(0,0,0,0.1);
    border-color: #0071e3;
}

.ticker-text {
    font-size: 2.2rem;
    font-weight: 800;
    color: #1d1d1f;
    margin-bottom: 5px;
}

.price-text {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1d1d1f;
    letter-spacing: -1.5px;
}

.buy-badge {
    background: #34c759;
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
}

/* Info Grid på kortet */
.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid #f5f5f7;
}

.info-item label {
    display: block;
    font-size: 0.85rem;
    color: #86868b;
    font-weight: 600;
    text-transform: uppercase;
}

.info-item span {
    font-size: 1.1rem;
    font-weight: 700;
}

.potential-up { color: #34c759; }
.risk-down { color: #ff3b30; }

/* Status Seksjon */
.status-box {
    background: #f5f5f7;
    border-radius: 20px;
    padding: 25px;
    text-align: center;
    margin-bottom: 30px;
}
.status-number { font-size: 3rem; font-weight: 800; }
.status-label { color: #86868b; font-weight: 600; }

/* Stor Header i Analyse */
.big-header {
    font-size: 5rem !important;
    font-weight: 800 !important;
    letter-spacing: -3px;
    margin-bottom: 10px;
}
</style>
""", unsafe_allow_html=True)

# ============================================
# 3. DATA MOTOR & MOCK DATA
# ============================================
watchlist = [
    "NOD.OL", "SATS.OL", "KID.OL", "VAR.OL", "PROT.OL", "AKSO.OL", "NEL.OL", 
    "FRO.OL", "GOGL.OL", "NAS.OL", "DNB.OL", "EQNR.OL", "YAR.OL", "NHY.OL", 
    "MOWI.OL", "SUBC.OL", "TGS.OL", "AKRBP.OL", "ADE.OL", "IDEX.OL", "AUTO.OL", 
    "LSG.OL", "SALM.OL", "BAKK.OL", "TOM.OL", "KOG.OL", "BORR.OL", "OKEA.OL"
]

def get_mock_data(ticker):
    return {
        "insiders": [{"navn": "Kjell Inge Røkke", "endring": "+12%", "dato": "10.05.24"}, {"navn": "John Fredriksen", "endring": "+5%", "dato": "12.05.24"}],
        "bjellesauer": ["Folketrygdfondet", "Aker ASA", "Canica AS"],
        "konsensus": "OVERWEIGHT",
        "target_diff": "+14%"
    }

@st.cache_data(ttl=1800)
def fetch_and_analyze():
    results = []
    for t in watchlist:
        try:
            df = yf.download(t, period="1y", interval="1d", progress=False)
            if df.empty or len(df) < 60: continue
            if isinstance(df.columns, pd.MultiIndex): df.columns = df.columns.droplevel(1)
            
            close = float(df['Close'].iloc[-1])
            rsi = ta.rsi(df['Close'], length=14).iloc[-1]
            sma20 = ta.sma(df['Close'], length=20).iloc[-1]
            
            is_buy = (rsi < 55) and (close > sma20)
            prob = min(max(int((100 - rsi) * 1.2), 15), 95)
            
            results.append({
                "ticker": t, "pris": round(close, 2), "endring": round(((close - df['Close'].iloc[-2]) / df['Close'].iloc[-2]) * 100, 2),
                "rsi": round(rsi, 1), "signal": "BUY" if is_buy else "HOLD", "prob": prob,
                "stop_loss": round(close * 0.965, 2), "target": round(close * 1.105, 2),
                "risk_kr": round(close * 0.035, 2), "pot_kr": round(close * 0.105, 2), "df": df
            })
        except: continue
    return sorted(results, key=lambda x: (x['signal'] != 'BUY', -x['prob']))

# ============================================
# 4. SIDEBAR MENY
# ============================================
with st.sidebar:
    st.markdown("<h1 style='font-size: 2rem; font-weight: 800;'>🏝️ K-man</h1>", unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)
    
    if st.button("🏠  Dashboard"):
        st.session_state.page = 'Dashboard'
        st.session_state.selected_ticker = None
        st.rerun()
        
    if st.button("📊  Børsoversikt"):
        st.session_state.page = 'Overview'
        st.session_state.selected_ticker = None
        st.rerun()
        
    st.markdown("---")
    st.caption(f"Live: {datetime.now().strftime('%H:%M')}")

# ============================================
# 5. HOVEDINNHOLD
# ============================================
data = fetch_and_analyze()

# --- ANALYSE VISNING ---
if st.session_state.selected_ticker:
    stock = next(d for d in data if d['ticker'] == st.session_state.selected_ticker)
    mock = get_mock_data(stock['ticker'])
    
    if st.button("⬅️ Tilbake til Dashboard"):
        st.session_state.selected_ticker = None
        st.rerun()
        
    st.markdown(f"<h1 class='big-header'>{stock['ticker']}</h1>", unsafe_allow_html=True)
    
    col_l, col_r = st.columns([2, 1])
    with col_l:
        st.markdown("### Teknisk Formasjon")
        df_p = stock['df'].tail(90)
        fig = go.Figure(data=[go.Candlestick(x=df_p.index, open=df_p['Open'], high=df_p['High'], low=df_p['Low'], close=df_p['Close'])])
        fig.add_hline(y=stock['stop_loss'], line_dash="dash", line_color="#ff3b30", annotation_text="STOP LOSS")
        fig.add_hline(y=stock['target'], line_dash="dash", line_color="#34c759", annotation_text="TARGET")
        fig.update_layout(height=500, xaxis_rangeslider_visible=False, template="plotly_white")
        st.plotly_chart(fig, use_container_width=True)
        
        st.markdown("### Siste Nyheter")
        st.info(f"Henter siste oppdateringer for {stock['ticker']}...")

    with col_r:
        st.markdown(f"""
            <div style="background:#f5f5f7; padding:30px; border-radius:24px;">
                <h3 style="margin-top:0;">Handelsplan</h3>
                <p>Signal: <strong>{stock['signal']}</strong></p>
                <p>Sannsynlighet: <strong style="font-size:1.5rem; color:#0071e3;">{stock['prob']}%</strong></p>
                <hr>
                <p>Target: <strong style="color:#34c759;">{stock['target']} NOK</strong></p>
                <p>Stop Loss: <strong style="color:#ff3b30;">{stock['stop_loss']} NOK</strong></p>
            </div>
            <br>
            <h3>Innsidehandel</h3>
        """, unsafe_allow_html=True)
        for i in mock['insiders']:
            st.write(f"• **{i['navn']}**: {i['endring']} ({i['dato']})")
        
        st.markdown("<br><h3>Bjellesauer</h3>", unsafe_allow_html=True)
        for b in mock['bjellesauer']:
            st.write(f"• {b}")

# --- DASHBOARD VISNING ---
elif st.session_state.page == 'Dashboard':
    st.markdown("<h1 style='font-size: 3rem; font-weight: 800; margin-bottom: 40px;'>Oversikt</h1>", unsafe_allow_html=True)
    
    # Grid for Top Muligheter
    cols = st.columns(3)
    for i, stock in enumerate(data[:6]):
        with cols[i % 3]:
            st.markdown(f"""
                <div class="card-container">
                    <span class="buy-badge">{stock['signal']}</span>
                    <div class="ticker-text">{stock['ticker']}</div>
                    <div class="price-text">{stock['pris']} NOK</div>
                    <div style="color:{'#34c759' if stock['endring'] >= 0 else '#ff3b30'}; font-weight:700;">
                        {'▲' if stock['endring'] >= 0 else '▼'} {abs(stock['endring'])}%
                    </div>
                    <div class="info-grid">
                        <div class="info-item"><label>Potensial</label><span class="potential-up">+{stock['pot_kr']} kr</span></div>
                        <div class="info-item"><label>Risiko</label><span class="risk-down">-{stock['risk_kr']} kr</span></div>
                    </div>
                </div>
            """, unsafe_allow_html=True)
            if st.button(f"Sjekk {stock['ticker']}", key=f"btn_{stock['ticker']}"):
                st.session_state.selected_ticker = stock['ticker']
                st.rerun()

# --- OVERSIKT VISNING ---
elif st.session_state.page == 'Overview':
    st.markdown("<h1 style='font-size: 3rem; font-weight: 800; margin-bottom: 40px;'>Alle Aksjer</h1>", unsafe_allow_html=True)
    df_display = pd.DataFrame([{ "Ticker": d['ticker'], "Signal": d['signal'], "Pris": d['pris'], "Endring": f"{d['endring']}%", "Gevinst Prob": f"{d['prob']}%" } for d in data])
    st.table(df_display)

st.markdown("---")
st.caption("K-man Island © 2026 | Kick Arse Strategy for Oslo Børs.")
